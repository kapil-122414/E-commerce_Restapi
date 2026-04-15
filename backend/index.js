require("dotenv").config();

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const connectdb = require("./config/bd");

const routes = require("./Routes/Routers");
const productrouter = require("./Routes/ProductRouter");
const registerrouter = require("./Routes/RegisterRouter");
const cartsrouter = require("./Routes/CartsRouter");
const orderd = require("./Routes/orderdRouter");
const payment = require("./Routes/paymentRouter");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectdb();

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5500", // ya frontend URL
    credentials: true,
  }),
);
const port = process.env.PORT || 5000;
app.use("/api", routes);
app.use("/api", productrouter);
app.use("/api", registerrouter);
app.use("/api", cartsrouter);
app.use("/api", orderd);
app.use("/api", payment);
app.use("/uploads", express.static("uploads"));

app.get("/api", (req, res) => {
  console.log("hyy");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
