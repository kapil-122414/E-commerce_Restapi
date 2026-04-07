require("dotenv").config();

const express = require("express");
const app = express();

const connectdb = require("./config/bd");
const routes = require("./Routes/Routers");
const productrouter=require("./Routes/ProductRouter");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectdb();
const cors = require("cors");
app.use(cors({ origin: "*" }));
const port = process.env.PORT || 5000;
app.use("/api", routes);
app.use("/api", productrouter);
app.use("/uploads", express.static("uploads"));

app.get("/api", (req, res) => {
  console.log("hyy");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
