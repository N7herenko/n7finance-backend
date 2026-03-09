import mongoose from "mongoose";

const stockTransactionsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  ticker: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  datetime: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  oldTicker: {
    type: String,
    required: false,
  },
  resudialInvested: {
    type: Number,
    required: false,
  },
});

export default mongoose.model("stock_transaction", stockTransactionsSchema);
