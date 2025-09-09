import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  updateContactsStatus,
  importCustomers
} from "../../controllers/admin/customerController.js";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// All customer routes are now protected and scoped to the logged-in admin
router.route("/")
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route("/import")
  .post(protect, upload.single('file'), importCustomers);

router.route("/:id")
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

router.route("/:id/active")
  .put(protect, updateCustomerStatus);

router.route("/:id/contacts-active")
  .put(protect, updateContactsStatus);

export default router;
