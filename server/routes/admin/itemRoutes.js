import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  getItems,
  createItem,
  importItems,
  bulkDeleteItems
} from "../../controllers/admin/itemController.js";

const router = express.Router();

// All item routes are protected and admin-specific
router.get("/items", protect, getItems);                 // View all items for admin
router.post("/items", protect, createItem);              // Create item for admin
router.post("/items/import", protect, importItems);      // Import items for admin
router.post("/items/bulk-delete", protect, bulkDeleteItems); // Bulk delete items for admin

export default router;