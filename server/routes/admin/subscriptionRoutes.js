import express from "express";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  importSubscriptions,
  searchCustomers
} from "../../controllers/admin/subscriptionController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// All subscription routes (protected with JWT middleware)
router.route("/")
  .get(protect, getSubscriptions)
  .post(protect, createSubscription);

router.route("/import")
  .post(protect, upload.single('file'), importSubscriptions);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/:id")
  .put(protect, updateSubscription)
  .delete(protect, deleteSubscription);

export default router;