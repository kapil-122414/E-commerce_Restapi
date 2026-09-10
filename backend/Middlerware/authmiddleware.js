const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

const authmiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.Token || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Token not valid" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = authmiddleware;