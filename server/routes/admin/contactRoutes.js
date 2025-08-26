import express from "express";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  searchCustomers
} from "../../controllers/admin/contactController.js";
import multer from "multer";

const upload = multer();

const router = express.Router();

// Contact routes
router.route("/")
  .get(getContacts)
  .post(createContact);

router.route("/import")
  .post(upload.single('file'), importContacts);

router.route("/customers/search")
  .get(searchCustomers);

router.route("/:id")
  .put(updateContact)
  .delete(deleteContact);

export default router;