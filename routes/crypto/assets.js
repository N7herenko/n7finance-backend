import express from "express";
import {
  create,
  deleteAsset,
  fetch,
  fetchByTicker,
  update,
} from "../../controllers/crypto/assets.js";
const route = express.Router();

route.get("/fetch", fetch);
route.get("/fetch-by-ticker/:ticker", fetchByTicker);
route.post("/create", create);
route.put("/update/:id", update);
route.delete("/delete/:id", deleteAsset);

export default route;
