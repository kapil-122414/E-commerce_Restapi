require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectdb = require("./config/bd");
const cloudinary = require("./config/cloudinary");

const routes = require("./Routes/Routers");
const productrouter = require("./Routes/ProductRouter");
const registerrouter = require("./Routes/RegisterRouter");
const cartsrouter = require("./Routes/CartsRouter");
const orderd = require("./Routes/orderdRouter");
const payment = require("./Routes/paymentRouter");
const brands = require("./Routes/BrandRouter");
const apiroute = require("./Routes/apiRouter");
const dashboardrouter = require("./Routes/DashboardRouter");
const customerrouter = require("./Routes/CustomerRouter");
const globalsearchrouter = require("./Routes/GlobalSearchRouter");
const analyticsrouter = require("./Routes/AnalyticsRouter");
const settingrouter = require("./Routes/SettingRouter");

const app = express();

// ================= SECURITY MIDDLEWARE =================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://e-commerce-dashboard-1.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ================= RATE LIMITING =================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/register", authLimiter);
app.use("/api/login", authLimiter);
app.use("/api", apiLimiter);

// ================= DATABASE =================
connectdb();

const warmupCloudinary = async () => {
  try {
    await cloudinary.api.ping();
    console.log(" Cloudinary connected & ready");
  } catch (error) {
    console.error("❌ Cloudinary Error:", error.message);
  }
};
warmupCloudinary();

// ================= ROUTES =================
app.use("/api", routes);
app.use("/api", productrouter);
app.use("/api", registerrouter);
app.use("/api", cartsrouter);
app.use("/api", orderd);
app.use("/api", payment);
app.use("/api", brands);
app.use("/uploads", express.static("uploads"));
app.use("/api", apiroute);
app.use("/api", dashboardrouter);
app.use("/api", customerrouter);
app.use("/api", globalsearchrouter);
app.use("/api", analyticsrouter);
app.use("/api", settingrouter);

// ================= TEST ROUTE =================
app.get("/api", (req, res) => {
  res.json({ success: true, message: "API Working Successfully" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  const isDevelopment = process.env.NODE_ENV !== "production";
  res.status(500).json({
    success: false,
    errorName: err.name,
    message: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});

server.timeout = 300000;
