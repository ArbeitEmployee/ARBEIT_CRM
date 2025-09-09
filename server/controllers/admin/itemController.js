import Item from "../../models/item.js";

// @desc    Get all items for a specific admin
// @route   GET /api/admin/items
export const getItems = async (req, res) => {
  try {
    const items = await Item.find({ admin: req.admin._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add new item for a specific admin
// @route   POST /api/admin/items
export const createItem = async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      admin: req.admin._id // Add admin ID from authenticated admin
    });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Item with this description already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Import multiple items for a specific admin
// @route   POST /api/admin/items/import
export const importItems = async (req, res) => {
  try {
    const items = req.body.map(item => ({
      ...item,
      admin: req.admin._id // Add admin ID to each item
    }));
    
    const savedItems = await Item.insertMany(items, { ordered: false });
    res.status(201).json(savedItems);
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate items
      const savedItems = error.result.result.insertedIds.map(id => id._id);
      return res.status(207).json({ 
        message: "Some items were not imported due to duplicates",
        importedItems: savedItems 
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Bulk delete items for a specific admin
// @route   POST /api/admin/items/bulk-delete
export const bulkDeleteItems = async (req, res) => {
  try {
    const { ids } = req.body;
    // Only delete items that belong to the authenticated admin
    await Item.deleteMany({ 
      _id: { $in: ids },
      admin: req.admin._id 
    });
    res.json({ message: "Items deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};