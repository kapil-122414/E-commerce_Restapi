require("dotenv").config();

const express = require("express");
const app = express();
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
// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);

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

// ================= TEST ROUTE =================
app.get("/api", (req, res) => {
  res.json({ success: true, message: "API Working Successfully" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    success: false,
    errorName: err.name,
    message: err.message,
  });
});

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});

server.timeout = 300000;
