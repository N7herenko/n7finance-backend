import express from "express";
import {
  create,
  deleteTransaction,
  fetch,
  update,
} from "../../controllers/crypto/transactions.js";
const route = express.Router();

route.get("/fetch", fetch);
route.post("/create", create);
route.put("/update/:id", update);
route.delete("/delete/:id", deleteTransaction);

export default route;
