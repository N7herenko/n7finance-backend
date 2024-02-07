import mongoose from "mongoose";

const stockAssetSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
  },
  total_invested: {
    type: Number,
    required: false,
  },
  budget: {
    type: Number,
    default: 0,
  },
  holdings: {
    type: Number,
    required: false,
  },
  category: {
    type: String,
    default: "none",
  },
  active: {
    type: Boolean,
    required: true,
  },
  residual: {
    type: Number,
  },
  date_last_invested: {
    type: Number,
    required: false,
  },
  phase: {
    type: String,
    required: false,
  },
  risk: {
    type: String,
    required: false,
  },
});

export default mongoose.model("stock_asset", stockAssetSchema);
