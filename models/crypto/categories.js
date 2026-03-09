import mongoose from "mongoose";

const cryptoCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("crypto_categorie", cryptoCategorySchema);
