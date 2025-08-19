import express from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  updateContactsStatus,
} from "../../controllers/admin/customerController.js";

const router = express.Router();

// Customer routes
router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.route("/:id")
  .put(updateCustomer)
  .delete(deleteCustomer);

router.route("/:id/active")
  .put(updateCustomerStatus);

router.route("/:id/contacts-active")
  .put(updateContactsStatus);

export default router;