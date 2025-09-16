import express from "express";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  searchCustomers,
  getCustomerByCode
} from "../../controllers/admin/contactController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Contact routes (protected with JWT middleware)
router.route("/")
  .get(protect, getContacts)
  .post(protect, createContact);

router.route("/import")
  .post(protect, upload.single('file'), importContacts);

router.route("/customers/search")
  .get(protect, searchCustomers);

router.route("/customers/by-code/:code")
  .get(protect, getCustomerByCode);

router.route("/:id")
  .put(protect, updateContact)
  .delete(protect, deleteContact);

export default router;