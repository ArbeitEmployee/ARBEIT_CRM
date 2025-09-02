import express from 'express';
import {
  getAllEvents,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent
} from '../../controllers/admin/eventController.js';

const router = express.Router();

// Get all events
router.get('/', getAllEvents);

// Get events by date range
router.get('/range', getEventsByDateRange);

// Create a new event
router.post('/', createEvent);

// Update an event
router.put('/:id', updateEvent);

// Delete an event
router.delete('/:id', deleteEvent);

export default router;
