const express = require("express");

const registerschma = require("../models/Registermodels");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authmiddleware = require("../Middlerware/authmiddleware");
const { registerValidation, loginValidation } = require("../middleware/validation");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";
const NODE_ENV = process.env.NODE_ENV || "development";

router.post("/register", registerValidation, async (req, res) => {
  try {
    const { Email, Password } = req.body;

    const Emailfind = await registerschma.findOne({ Email: Email.toLowerCase() });
    if (Emailfind) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedpassword = await bcrypt.hash(Password, 12);
    await registerschma.create({
      Email: Email.toLowerCase(),
      Password: hashedpassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", loginValidation, async (req, res) => {
  try {
    const { Email, Password } = req.body;

    const Emailfind = await registerschma.findOne({ Email: Email.toLowerCase() });

    if (!Emailfind) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordcheck = await bcrypt.compare(Password, Emailfind.Password);
    if (!passwordcheck) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const Role = Emailfind.Role;

    const Token = jwt.sign(
      {
        id: Emailfind._id,
        Email: Emailfind.Email,
        Role: Role,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("token", Token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    const responseData = {
      message: "Login successful",
      Role: Role,
    };

    if (Role === "admin") {
      responseData.id = Emailfind._id;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

//token verify
router.get("/profile", authmiddleware, async (req, res) => {
  res.json({
    message: "Profile fetched successfully",
    user: {
      Email: req.user.Email,
    },
  });
});

router.get("/user", authmiddleware, async (req, res) => {
  if (req.user.Role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  const users = await registerschma.find().select("-Password");
  res.json({ users });
});

module.exports = router;
