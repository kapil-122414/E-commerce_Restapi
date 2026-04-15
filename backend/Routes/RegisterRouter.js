const express = require("express");

const registerschma = require("../models/Registermodels");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authmiddleware = require("../Middlerware/authmiddleware");

router.post("/register", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.json({ message: "Email or password required" });
    }
    const Emailfind = await registerschma.findOne({ Email: Email });
    if (Emailfind) {
      return res.json({ message: "User already exists" });
    }

    const hashedpassword = await bcrypt.hash(Password, 10);
    const newuser = await registerschma.create({
      Email: Email,

      Password: hashedpassword,
    });

    res.status(200).json({ message: "successfuly" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;
    const Emailfind = await registerschma.findOne({ Email: Email });
    if (!Emailfind) {
      return res.status(400).json({ message: "Email not register" });
    }
    const passwordcheck = await bcrypt.compare(Password, Emailfind.Password);
    if (!passwordcheck) {
      return res.status(400).json({ message: "enter correct passwor" });
    }
    const Role = Emailfind.Role;

    const Token = jwt.sign(
      {
        id: Emailfind._id,
        Email: Email,
      },
      "secretkey",
      { expiresIn: "1h" },
    );
    res.cookie("token", Token, {
      httpOnly: true,
      secure: false,

      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });
    if (Role === "user") {
      return res
        .status(200)
        .json({ message: "login successfly", token: Token, Role: Role });
    }
    if (Role === "admin") {
      return res.status(200).json({
        message: "login successfly",
        token: Token,
        Role: Role,
        id: id,
      });
    }

    res.status(200).json({ message: "successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
router.get("/user", (req, res) => {
  const token = req.cookies.token;

  const findrole = registerschma.find();
  console.log(findrole);
});

module.exports = router;
