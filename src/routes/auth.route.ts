import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from "../controller/auth.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// Protected routes (requires authentication)
authRouter.get("/profile", authMiddleware, getProfile);
authRouter.put("/profile", authMiddleware, updateProfile);
authRouter.post("/change-password", authMiddleware, changePassword);

export default authRouter;
