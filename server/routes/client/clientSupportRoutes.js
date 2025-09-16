import express from "express";
import { 
  getClientSupportTickets, 
  getClientSupportTicket 
} from "../../controllers/client/clientSupportController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client support routes (all protected with client JWT middleware)
router.route("/")
  .get(clientProtect, getClientSupportTickets);

router.route("/:id")
  .get(clientProtect, getClientSupportTicket);

export default router;