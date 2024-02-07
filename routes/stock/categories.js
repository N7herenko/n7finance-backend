import express from "express";
import {
  create,
  deleteCategory,
  fetch,
  update,
} from "../../controllers/stock/categories.js";
const route = express.Router();

route.get("/fetch", fetch);
route.post("/create", create);
route.put("/update/:id", update);
route.delete("/delete/:id", deleteCategory);

export default route;
