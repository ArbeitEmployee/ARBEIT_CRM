import express from "express";
import { 
  getClientProjects, 
  getClientProject 
} from "../../controllers/client/clientProjectController.js";
import { clientProtect } from "../../middlewares/clientAuth.js";

const router = express.Router();

// Client project routes (all protected with client JWT middleware)
router.route("/")
  .get(clientProtect, getClientProjects);

router.route("/:id")
  .get(clientProtect, getClientProject);

export default router;