import mongoose from "mongoose";

const diversificationSchema = new mongoose.Schema({
  sector: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

export default mongoose.model(
  "net_worth_diversification",
  diversificationSchema
);
