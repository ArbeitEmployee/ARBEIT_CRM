import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements
} from "../../controllers/admin/announcementController.js";

const router = express.Router();

router.route("/")
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route("/bulk-delete")
  .post(bulkDeleteAnnouncements);

router.route("/:id")
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

export default router;