import mongoose from "mongoose";

const stockCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("stock_categorie", stockCategorySchema);
