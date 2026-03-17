import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User is required"],
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh Token Hash is required"],
    },
    ip: {
      type: String,
      required: [true, "IP is required"],
    },
    userAgent: {
      type: String,
      required: [true, "User Agent is required"],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);


const sessionModels =  mongoose.model("sessions", sessionSchema);
export default sessionModels;