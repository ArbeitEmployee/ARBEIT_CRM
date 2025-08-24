import express from "express";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  importSubscriptions,
  searchCustomers
} from "../../controllers/admin/subscriptionController.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Subscription routes
router.route("/")
  .get(getSubscriptions)
  .post(createSubscription);

router.route("/import")
  .post(upload.single('file'), importSubscriptions);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/:id")
  .put(updateSubscription)
  .delete(deleteSubscription);

export default router;