import express from "express";
import { getItems, createItem, importItems, bulkDeleteItems } from "../../controllers/admin/itemController.js";

const router = express.Router();

router.get("/items", getItems);
router.post("/items", createItem);
router.post("/items/import", importItems);
router.post("/items/bulk-delete", bulkDeleteItems);

export default router;