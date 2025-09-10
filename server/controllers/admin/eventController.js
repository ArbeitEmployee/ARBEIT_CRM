import Event from '../../models/Event.js';

// Get all events for the logged-in admin
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ admin: req.admin._id }).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get events for a specific date range for the logged-in admin
export const getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { admin: req.admin._id };
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const events = await Event.find(query).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new event for the logged-in admin
export const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      admin: req.admin._id
    };
    const event = new Event(eventData);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an event (only if it belongs to the logged-in admin)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update the event
    Object.assign(event, req.body);
    const updatedEvent = await event.save();
    
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an event (only if it belongs to the logged-in admin)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ 
      _id: req.params.id, 
      admin: req.admin._id 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};