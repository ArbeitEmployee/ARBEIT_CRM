import React, { useState, useEffect } from "react";
import axios from "axios";

const colors = [
  "#1BC5BD", "#8950FC", "#F64E60", "#E4E6EF", "#A1A5B7",
  "#F1416C", "#FFC700", "#50CD89", "#7239EA", "#FFA800"
];

const daysInWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const dates = [];
  
  // Padding empty days for previous month
  for(let i=0; i<startDayOfWeek; i++) {
    dates.push(null);
  }
  
  for(let d=1; d<=lastDate; d++) {
    dates.push(new Date(year, month, d));
  }
  
  return dates;
}

const EventModal = ({ show, onClose, onSave, selectedDate, eventToEdit, onUpdate }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(selectedDate ? selectedDate.toISOString().slice(0,16) : "");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when selectedDate or show changes
  React.useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || "");
      setStartDate(new Date(eventToEdit.startDate).toISOString().slice(0,16));
      setEndDate(eventToEdit.endDate ? new Date(eventToEdit.endDate).toISOString().slice(0,16) : "");
      setColor(eventToEdit.color || colors[0]);
      setIsEditing(true);
    } else if (selectedDate) {
      setStartDate(selectedDate.toISOString().slice(0,16));
      setTitle("");
      setDescription("");
      setEndDate("");
      setColor(colors[0]);
      setIsEditing(false);
    }
  }, [selectedDate, show, eventToEdit]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Event title is required");
      return;
    }
    
    const eventData = {
      title: title.trim(),
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      color,
      publicEvent: false,
    };
    
    if (isEditing && eventToEdit) {
      onUpdate(eventToEdit._id, eventData);
    } else {
      onSave(eventData);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        background: "white",
        borderRadius: 8,
        width: "600px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 20,
        boxSizing: "border-box",
      }}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10}}>
          <h3>{isEditing ? "Edit Event" : "Add New Event"}</h3>
          <button onClick={onClose} style={{ fontSize: 20, border: "none", background: "transparent", cursor: "pointer" }}>×</button>
        </div>
        
        <label><b>Event title*</b></label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          style={{width: "100%", marginBottom: 10, padding: 6}} 
          placeholder="Enter event title"
        />

        <label>Description</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          style={{width: "100%", marginBottom: 10, padding: 6, minHeight: 60}} 
          placeholder="Enter description"
        />

        <label><b>Start Date*</b></label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{width: "100%", marginBottom: 10, padding: 6}}
        />

        <label>End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          style={{width: "100%", marginBottom: 10, padding: 6}}
        />

        <label><b>Event Color</b></label>
        <div style={{display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10}}>
          {colors.map(c => (
            <div 
              key={c} 
              onClick={() => setColor(c)} 
              style={{
                backgroundColor: c,
                width: 24, height: 24,
                borderRadius: "50%",
                cursor: "pointer",
                border: color === c ? "3px solid black" : "1px solid #ccc",
              }}
            />
          ))}
        </div>

        <div style={{textAlign: "right", marginTop: 20}}>
          <button onClick={onClose} style={{marginRight: 10, padding: "6px 12px"}}>Close</button>
          <button onClick={handleSubmit} style={{padding: "6px 12px", background: "#0d6efd", color: "white", border: "none", borderRadius: 3}}>
            {isEditing ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Calendar = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const monthDays = generateMonthDays(currentYear, currentMonth);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, [currentYear, currentMonth]);

  const fetchEvents = async () => {
    try {
      // Calculate start and end of month for date range
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const response = await axios.get(`http://localhost:5000/api/admin/events/range`, {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const openModal = (date) => {
    setSelectedDate(date);
    setEventToEdit(null);
    setShowModal(true);
  };

  const openEditModal = (event, e) => {
    e.stopPropagation();
    setEventToEdit(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEventToEdit(null);
  };

  const saveEvent = async (eventData) => {
    try {
      await axios.post('http://localhost:5000/api/admin/events', eventData);
      fetchEvents(); // Refresh events
      setShowModal(false);
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event");
    }
  };

  const updateEvent = async (id, eventData) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/events/${id}`, eventData);
      fetchEvents(); // Refresh events
      setShowModal(false);
      setEventToEdit(null);
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Error updating event");
    }
  };

  const deleteEvent = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/events/${id}`);
        fetchEvents(); // Refresh events
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event");
      }
    }
  };

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const eventsForDate = (date) => {
    return events.filter(ev => {
      // Filter by startDate (date only)
      const evDate = new Date(ev.startDate);
      return date && evDate.getFullYear() === date.getFullYear() &&
        evDate.getMonth() === date.getMonth() &&
        evDate.getDate() === date.getDate();
    });
  };

  return (
    <div style={{width: "100%", height: "100vh", margin: "0", padding: "20px", fontFamily: "Arial, sans-serif", boxSizing: "border-box"}}>
      {/* Header / Controls */}
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
        <div>
          <button onClick={goPrevMonth} style={{marginRight: 10}}>{"<"}</button>
          <button onClick={goNextMonth} style={{marginRight: 10}}>{">"}</button>
          <button onClick={goToday}>Today</button>
        </div>
        <h2>{new Date(currentYear, currentMonth).toLocaleString('default', {month: 'long', year: 'numeric'})}</h2>
        <div>
          <button style={{marginRight: 5, backgroundColor: "#0a192f", color: "white", padding: "6px 12px", border: "none", borderRadius: 3}}>Month</button>
          <button style={{marginRight: 5, padding: "6px 12px", borderRadius: 3}}>Week</button>
          <button style={{marginRight: 5, padding: "6px 12px", borderRadius: 3}}>Day</button>
        </div>
      </div>

      {/* Days of week header */}
      <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8}}>
        {daysInWeek.map(day => (
          <div key={day} style={{textAlign: "center", fontWeight: "bold", padding: "8px 0"}}>{day}</div>
        ))}
      </div>

      {/* Dates grid */}
      <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, height: "calc(100vh - 180px)", overflowY: "auto", border: "1px solid #ddd", padding: 4, borderRadius: 5}}>
        {monthDays.map((date, idx) => (
          <div 
            key={idx} 
            onClick={() => date && openModal(date)} 
            style={{
              border: "1px solid #ccc",
              minHeight: 85,
              padding: 6,
              cursor: date ? "pointer" : "default",
              backgroundColor: date && (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
              ) ? "#d0e6ff" : "white",
              color: date ? "black" : "#ccc",
              borderRadius: 4,
              overflow: "hidden",
              fontSize: 14
            }}
          >
            {date ? date.getDate() : ""}
            <div style={{marginTop: 4, display: "flex", flexDirection: "column", gap: 4}}>
              {eventsForDate(date).map((ev, i) => (
                <div 
                  key={i} 
                  onClick={(e) => openEditModal(ev, e)}
                  style={{
                    backgroundColor: ev.color,
                    color: "white",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                  title={ev.title}
                >
                  <span>{ev.title}</span>
                  <span 
                    onClick={(e) => deleteEvent(ev._id, e)}
                    style={{cursor: "pointer", marginLeft: "5px"}}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <EventModal 
        show={showModal} 
        onClose={closeModal} 
        onSave={saveEvent} 
        onUpdate={updateEvent}
        selectedDate={selectedDate} 
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default Calendar;
