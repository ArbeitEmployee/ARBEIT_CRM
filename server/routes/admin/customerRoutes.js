import express from "express";
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

const upload = multer();

const router = express.Router();

// Customer routes
router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.route("/import")
  .post(upload.single('file'), importCustomers);

router.route("/:id")
  .put(updateCustomer)
  .delete(deleteCustomer);

router.route("/:id/active")
  .put(updateCustomerStatus);

router.route("/:id/contacts-active")
  .put(updateContactsStatus);

export default router;