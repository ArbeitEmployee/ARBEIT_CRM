import express from "express";
import { 
  getClientInvoices, 
  getClientInvoice, 

  recordPayment
} from "../../controllers/client/clientInvoiceController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client invoice routes (all protected with client JWT middleware)
router.route("/invoices")
  .get(clientProtect, getClientInvoices);

router.route("/invoices/:id")
  .get(clientProtect, getClientInvoice);



router.route("/invoices/payments")
  .post(clientProtect, recordPayment);

export default router;


