import express from "express";
import { getItems, createItem } from "../../controllers/admin/itemController.js";

const router = express.Router();

router.get("/items", getItems);
router.post("/items", createItem);

export default router;
