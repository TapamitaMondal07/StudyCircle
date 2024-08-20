const { Router } = require("express");
const express = require("express");
const { User } = require("../db");
const router = express.Router();
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const authMiddleware = require("../middleware/auth");
// User Routes
router.post("/signup", async (req, res) => {
  // Implemented User signup logic
  try {
    const username = req.body.username;
    const password = req.body.password;
    const existingUser = await User.findOne({
      username: username,
    });
    if (!existingUser) {
      const encodedPassword = await bycrypt.hash(password, 10);
      await User.create({
        username: username,
        password: encodedPassword,
      });
      res.json({
        msg: "User created successfully",
      });
    } else {
      res.json({
        msg: "User already exist",
      });
    }
  } catch (error) {
    res.status(500).json({
      msg: "An error occurred during signup",
      error: error.message,
    });
  }
});

router.post("/signin", async (req, res) => {
  // Implemented User login logic
  try {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      const validPassword = await bycrypt.compare(
        password,
        existingUser.password
      );
      if (!validPassword) {
        return res.json({
          msg: "your password is incorrect",
        });
      }
      const token = jwt.sign(
        {
          username,
        },
        JWT_SECRET
      );
      return res.json({
        token,
      });
    }
    return res.json({
      msg: "User does not exist",
    });
  } catch (error) {
    res.status(500).json({
      msg: "An error occurred during signin",
      error: error.message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const username = req.user?.username; // Extract username from token
    if (!username) {
      return res.status(403).json({ message: "Username not found in token" });
    }
    const user = await User.findOne({ username }).select("-password"); // Find user by username

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
