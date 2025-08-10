const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// AUTH Middleware
exports.auth = async (req, res, next) => {
  try {
    console.log("BEFORE TOKEN EXTRACTION");

    // Safely extract token from cookie, body, or Authorization header
    const authHeader = req.headers.authorization;

    const token =
      req.cookies?.token ||
      req.body?.token ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    console.log("AFTER TOKEN EXTRACTION");

    // If token is missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    try {
      // Verify token
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    next(); // Go to next middleware
  } catch (error) {
    console.log("AUTH MIDDLEWARE ERROR →", error);
    return res.status(401).json({
      success: false,
      message: "Something went wrong while validating the token",
    });
  }
};

// Role: Student
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Students only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};

// Role: Instructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Instructor only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};

// Role: Admin
exports.isAdmin = async (req, res, next) => {
  try {
    console.log("Printing AccountType ", req.user.accountType);
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified, please try again",
    });
  }
};
