import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements
} from "../../controllers/admin/announcementController.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All routes are protected and require admin authentication
router.use(protect);

router.route("/")
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route("/bulk-delete")
  .post(bulkDeleteAnnouncements);

router.route("/:id")
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

export default router;