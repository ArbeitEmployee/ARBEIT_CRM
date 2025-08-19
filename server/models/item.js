import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    longDescription: { type: String },
    rate: { type: String, required: true },
    tax1: { type: String },
    tax2: { type: String },
    unit: { type: String },
    groupName: { type: String },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);
export default Item;
