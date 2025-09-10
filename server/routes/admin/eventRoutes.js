import express from 'express';
import {
  getAllEvents,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent
} from '../../controllers/admin/eventController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected - only accessible to authenticated admins
router.get('/', protect, getAllEvents);
router.get('/range', protect, getEventsByDateRange);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

export default router;