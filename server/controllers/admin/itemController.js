import Item from "../../models/item.js";

// @desc    Get all items
// @route   GET /api/admin/items
export const getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add new item
// @route   POST /api/admin/items
export const createItem = async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Import multiple items
// @route   POST /api/admin/items/import
export const importItems = async (req, res) => {
  try {
    const items = req.body;
    const savedItems = await Item.insertMany(items);
    res.status(201).json(savedItems);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Bulk delete items
// @route   POST /api/admin/items/bulk-delete
export const bulkDeleteItems = async (req, res) => {
  try {
    const { ids } = req.body;
    await Item.deleteMany({ _id: { $in: ids } });
    res.json({ message: "Items deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};