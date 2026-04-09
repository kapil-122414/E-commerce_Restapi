const jwt = require("jsonwebtoken");

const authmiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Token not valid" });
    }

    const decoded = jwt.verify(token, "secretkey");

    req.user = decoded; // 🔥 yaha userId / Email store karo

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = authmiddleware;