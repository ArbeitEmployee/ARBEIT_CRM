import express from "express";
import { 
  getClientContacts, 
  getClientContact 
} from "../../controllers/client/clientContactController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client contact routes (all protected with client JWT middleware)
router.route("/")
  .get(clientProtect, getClientContacts);

router.route("/:id")
  .get(clientProtect, getClientContact);

export default router;