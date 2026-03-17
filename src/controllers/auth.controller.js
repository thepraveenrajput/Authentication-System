import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHTML } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

export async function register(req, res) {
  const { username, email, password } = req.body;
  const isAlreadyRegistered = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isAlreadyRegistered) {
    return res.status(409).json({
      message: "Username or Email already exists",
    });
  }

  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  await otpModel.deleteMany({ email }); // cleanup old OTPs if any
  //! OTP Generation and Email Sending
  const otp = generateOtp();
  const html = getOtpHTML(otp);
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  await otpModel.create({
    email,
    user: user._id,
    otpHash,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  });

  await sendEmail(email, "OTP Verification", `Your OTP code is: ${otp}`, html);

  res.status(201).json({
    message: "User created successfully",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (!user.verified) {
    return res.status(401).json({
      message: "User not verified",
    });
  }

  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const isValidPassword = user.password === hashedPassword;

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    {
      id: user._id,
      session: session._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    message: "Logged in successfully",
    user: {
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
}

export async function getMe(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token not found",
    });
  }

  const decoded = jwt.verify(token, config.JWT_SECRET);
  const user = await userModel.findById(decoded.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.status(200).json({
    message: "User fetched Successfully",
    user: {
      username: user.username,
      email: user.email,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh Token not found",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const session = await sessionModel.findOne({
      refreshTokenHash,
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({
        message: "Invalid Refresh Token",
      });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Access Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Invalid Refresh Token",
    });
  }
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh Token not found",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Invalid Refresh Token",
    });
  }

  session.revoked = true;
  await session.save();

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "Logged out successfully",
  });
}

export async function logoutAllSessions(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh Token not found",
    });
  }

  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  await sessionModel.updateMany(
    {
      user: decoded.id,
      revoked: false,
    },
    {
      revoked: true,
    },
  );

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "Logged out from all sessions successfully",
  });
}

export async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and OTP are required",
    });
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const otpRecord = await otpModel.findOne({ email, otpHash });

  if (!otpRecord) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  // 🔥 Expiry check
  if (otpRecord.expiresAt < Date.now()) {
    await otpModel.deleteMany({ email }); // cleanup
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  // 🔐 Attempt limit
  otpRecord.attempts += 1;

  if (otpRecord.attempts > 3) {
    await otpModel.deleteMany({ email }); // cleanup
    return res.status(429).json({
      message: "Too many attempts. Request new OTP",
    });
  }

  await otpRecord.save();

  const user = await userModel.findById(otpRecord.user);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  user.verified = true;
  await user.save();

  // 🔥 Remove all OTPs after success
  await otpModel.deleteMany({ email });

  res.status(200).json({
    message: "Email verified successfully",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}

export async function resendOtp(req, res) {
  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (user.verified) {
    return res.status(400).json({
      message: "User already verified",
    });
  }

  // 🔥 Prevent spam (cooldown 30 sec)
  const existingOtp = await otpModel.findOne({ email });

  if (existingOtp && Date.now() - existingOtp.createdAt < 30 * 1000) {
    return res.status(429).json({
      message: "Please wait before requesting new OTP",
    });
  }

  await otpModel.deleteMany({ email });

  const otp = generateOtp();
  const html = getOtpHTML(otp);
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  await otpModel.create({
    email,
    user: user._id,
    otpHash,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  sendEmail(email, "OTP Verification", `Your OTP code is: ${otp}`, html).catch(
    (err) => console.error(err),
  );

  res.status(200).json({
    message: "OTP sent successfully",
  });
}