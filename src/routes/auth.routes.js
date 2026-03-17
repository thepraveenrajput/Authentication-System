import { Router } from "express";
import *  as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/*
 * @route POST /api/auth/register
 */

authRouter.post("/register" , authController.register);

/*
 * @route POST /api/auth/login
 */

authRouter.post("/login" , authController.login);

/*
 * @route POST /api/auth/get-me
 */

authRouter.post("/get-me" , authController.getMe);

/*
 * @route POST /api/auth/refresh-token
 */

authRouter.post("/refresh-token" , authController.refreshToken);

/*
 * @route GET /api/auth/logout
 */

authRouter.get("/logout" , authController.logout);

/*
 * @route GET /api/auth/logout-all
 */
authRouter.get("/logout-all" , authController.logoutAllSessions);

/*
 * @route POST /api/auth/verify-email
 */
authRouter.post("/verify-email" , authController.verifyEmail);



export default authRouter;
