import User, { IUser } from "../database/models/users";
import * as crypto from "crypto";

/**
 * Hash password using SHA256
 */
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

/**
 * Compare password with hash
 */
const comparePassword = (password: string, hash: string): boolean => {
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  return hashedPassword === hash;
};

/**
 * Generate a simple JWT token (consider using jsonwebtoken package for production)
 */
const generateToken = (userId: string): string => {
  const payload = {
    userId,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

/**
 * Register a new user
 */
export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = hashPassword(data.password);

    // Create new user
    const user = new User({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    return {
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
        token,
      },
    };
  } catch (error) {
    console.error("Register user error:", error);
    return {
      success: false,
      message: "Error registering user",
    };
  }
};

/**
 * Login user
 */
export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Find user by email
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: "User account is inactive",
      };
    }

    // Compare passwords
    const isPasswordValid = comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Generate token
    const token = generateToken(user._id.toString());

    return {
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
        token,
      },
    };
  } catch (error) {
    console.error("Login user error:", error);
    return {
      success: false,
      message: "Error logging in",
    };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error("Get user by ID error:", error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string }
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const updateData: any = {};

    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error("Update user profile error:", error);
    return {
      success: false,
      message: "Error updating profile",
    };
  }
};

/**
 * Change password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get user with password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Compare current password
    const isPasswordValid = comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedNewPassword = hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: "Error changing password",
    };
  }
};

/**
 * Verify token and get user ID
 */
export const verifyToken = (token: string): string | null => {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded.userId;
  } catch (error) {
    return null;
  }
};
