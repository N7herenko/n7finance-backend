import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cron from "node-cron";

import NetWorthDiversificationRoute from "./routes/net-worth/diversification.js";

import CryptoAssetsRoute from "./routes/crypto/assets.js";
import CryptoCategoriesRoute from "./routes/crypto/categories.js";
import CryptoTransactionsRoute from "./routes/crypto/transactions.js";

import StockAssetsRoute from "./routes/stock/assets.js";
import StockCategoriesRoute from "./routes/stock/categories.js";
import StockTransactionsRoute from "./routes/stock/transactions.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGOURL = process.env.DATABASE_URL;

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("DB connected successfully");
    cron.schedule("0 */12 * * *", () => {
      console.log("Running portfolio value update...");
      // calculateAndSavePortfolioValue();
    });
    app.listen(PORT, () => {
      console.log(`Server is running on port: http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));

app.use("/api/net-worth/diversification", NetWorthDiversificationRoute);

app.use("/api/crypto/assets", CryptoAssetsRoute);
app.use("/api/crypto/categories", CryptoCategoriesRoute);
app.use("/api/crypto/transactions", CryptoTransactionsRoute);

app.use("/api/stock/assets", StockAssetsRoute);
app.use("/api/stock/categories", StockCategoriesRoute);
app.use("/api/stock/transactions", StockTransactionsRoute);

app.get("/", (req, res) =>
  res.send(`Welcome to the ${process.env.TITLE} API!`)
);
app.all("*", (req, res) =>
  res.send("You've tried reaching a route that doesn't exist.")
);
