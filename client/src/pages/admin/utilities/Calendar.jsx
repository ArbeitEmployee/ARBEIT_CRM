// MultipleFiles/Calendar.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components"; // Import styled-components

const colors = [
  "#1BC5BD",
  "#8950FC",
  "#F64E60",
  "#E4E6EF",
  "#A1A5B7",
  "#F1416C",
  "#FFC700",
  "#50CD89",
  "#7239EA",
  "#FFA800",
];

const daysInWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function generateMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();

  const dates = [];

  // Padding empty days for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    dates.push(null);
  }

  for (let d = 1; d <= lastDate; d++) {
    dates.push(new Date(year, month, d));
  }

  return dates;
}

// Styled Components for EventModal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const CloseButton = styled.button`
  font-size: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #888;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #333;
  }
`;

const FormLabel = styled.label`
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  color: #333;
`;

const FormInput = styled.input`
  width: 100%;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #1a202c;
    box-shadow: 0 0 0 2px rgba(26, 32, 44, 0.25);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  margin-bottom: 15px;
  padding: 10px;
  min-height: 80px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #1a202c;
    box-shadow: 0 0 0 2px rgba(26, 32, 44, 0.25);
  }
`;

const ColorPickerContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const ColorSwatch = styled.div`
  background-color: ${(props) => props.color};
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: ${(props) =>
    props.isSelected ? "3px solid #333" : "2px solid #ccc"};
  transition: border 0.2s ease-in-out, transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const ModalFooter = styled.div`
  text-align: right;
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  &:not(:last-child) {
    margin-right: 10px;
  }

  &.primary {
    background: #4a5568;
    color: white;

    &:hover {
      background: #1a202c;
    }
  }

  &.secondary {
    background: #4a5568;
    color: white;

    &:hover {
      background: #1a202c;
    }
  }
`;

const EventModal = ({
  show,
  onClose,
  onSave,
  selectedDate,
  eventToEdit,
  onUpdate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    selectedDate ? selectedDate.toISOString().slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || "");
      setStartDate(new Date(eventToEdit.startDate).toISOString().slice(0, 16));
      setEndDate(
        eventToEdit.endDate
          ? new Date(eventToEdit.endDate).toISOString().slice(0, 16)
          : ""
      );
      setColor(eventToEdit.color || colors[0]);
      setIsEditing(true);
    } else if (selectedDate) {
      setStartDate(selectedDate.toISOString().slice(0, 16));
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
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h3>{isEditing ? "Edit Event" : "Add New Event"}</h3>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <FormLabel>Event title*</FormLabel>
        <FormInput
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
        />

        <FormLabel>Description</FormLabel>
        <FormTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />

        <FormLabel>Start Date*</FormLabel>
        <FormInput
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <FormLabel>End Date</FormLabel>
        <FormInput
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <FormLabel>Event Color</FormLabel>
        <ColorPickerContainer>
          {colors.map((c) => (
            <ColorSwatch
              key={c}
              color={c}
              isSelected={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </ColorPickerContainer>

        <ModalFooter>
          <ModalButton className="secondary" onClick={onClose}>
            Close
          </ModalButton>
          <ModalButton className="primary" onClick={handleSubmit}>
            {isEditing ? "Update" : "Save"}
          </ModalButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components for Calendar
const CalendarContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 30px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
  background-color: #f8f9fa;
  color: #343a40;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 25px;
  background-color: #ffffff;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const NavButton = styled.button`
  padding: 10px 15px;
  font-size: 20px;
  border: 1px solid #4a5568; /* Equivalent to gray-700 for border */
  border-radius: 8px;
  background: #2d3748; /* Equivalent to gray-800 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* Text white */
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #1a202c; /* Equivalent to gray-900 */
    border-color: #2d3748; /* Keep border consistent or slightly darker */
    color: white;
  }
`;

const MonthYearDisplay = styled.h2`
  margin: 0 25px;
  min-width: 220px;
  text-align: center;
  color: #343a40;
  font-size: 28px;
  font-weight: 600;
`;

const DaysOfWeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
  background-color: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
`;

const DayOfWeek = styled.div`
  text-align: center;
  font-weight: bold;
  padding: 12px 0;
  color: #495057;
  font-size: 15px;
  text-transform: uppercase;
`;

const DatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: calc(100vh - 250px); /* Adjusted height */
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  padding: 10px;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const DateCell = styled.div`
  border: 1px solid #e0e0e0;
  min-height: 100px; /* Increased min-height for better spacing */
  padding: 8px;
  cursor: ${(props) => (props.isClickable ? "pointer" : "default")};
  background-color: ${(props) =>
    props.isToday ? "#e6f7ff" : props.isCurrentMonth ? "white" : "#f8f9fa"};
  color: ${(props) => (props.isCurrentMonth ? "#333" : "#adb5bd")};
  border-radius: 8px;
  overflow: hidden;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    ${(props) =>
      props.isClickable &&
      `
      background-color: ${props.isToday ? "#d0eeff" : "#f0f0f0"};
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const DateNumber = styled.div`
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 5px;
  color: ${(props) => (props.isToday ? "#007bff" : "inherit")};
`;

const EventList = styled.div`
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 60px; /* Limit height for events */
  overflow-y: auto; /* Scroll for many events */
  padding-right: 2px; /* Space for scrollbar */
`;

const EventItem = styled.div`
  background-color: ${(props) => props.color};
  color: white;
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease-in-out;

  &:hover {
    transform: scale(1.02);
  }
`;

const EventTitle = styled.span`
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeleteEventButton = styled.span`
  cursor: pointer;
  margin-left: 8px;
  font-weight: bold;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease-in-out;

  &:hover {
    color: white;
  }
`;

const Calendar = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const monthDays = generateMonthDays(currentYear, currentMonth);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("crm_token");
  };

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  useEffect(() => {
    fetchEvents();
  }, [currentYear, currentMonth]);

  const fetchEvents = async () => {
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const config = createAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/admin/events/range`, {
        ...config,
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        },
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
      const config = createAxiosConfig();
      await axios.post(`${API_BASE_URL}/admin/events`, eventData, config);
      fetchEvents();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event");
    }
  };

  const updateEvent = async (id, eventData) => {
    try {
      const config = createAxiosConfig();
      await axios.put(`${API_BASE_URL}/admin/events/${id}`, eventData, config);
      fetchEvents();
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
        const config = createAxiosConfig();
        await axios.delete(`${API_BASE_URL}/admin/events/${id}`, config);
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event");
      }
    }
  };

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const eventsForDate = (date) => {
    return events.filter((ev) => {
      const evDate = new Date(ev.startDate);
      return (
        date &&
        evDate.getFullYear() === date.getFullYear() &&
        evDate.getMonth() === date.getMonth() &&
        evDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <NavButton onClick={goPrevMonth}>&lt;</NavButton>
        <MonthYearDisplay>
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </MonthYearDisplay>
        <NavButton onClick={goNextMonth}>&gt;</NavButton>
      </CalendarHeader>

      <DaysOfWeekHeader>
        {daysInWeek.map((day) => (
          <DayOfWeek key={day}>{day}</DayOfWeek>
        ))}
      </DaysOfWeekHeader>

      <DatesGrid>
        {monthDays.map((date, idx) => {
          const isToday =
            date &&
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const isCurrentMonth = date && date.getMonth() === currentMonth;

          return (
            <DateCell
              key={idx}
              onClick={() => date && openModal(date)}
              isClickable={!!date}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
            >
              {date && (
                <DateNumber isToday={isToday}>{date.getDate()}</DateNumber>
              )}
              <EventList>
                {eventsForDate(date).map((ev, i) => (
                  <EventItem
                    key={i}
                    onClick={(e) => openEditModal(ev, e)}
                    color={ev.color}
                    title={ev.title}
                  >
                    <EventTitle>{ev.title}</EventTitle>
                    <DeleteEventButton onClick={(e) => deleteEvent(ev._id, e)}>
                      ×
                    </DeleteEventButton>
                  </EventItem>
                ))}
              </EventList>
            </DateCell>
          );
        })}
      </DatesGrid>

      <EventModal
        show={showModal}
        onClose={closeModal}
        onSave={saveEvent}
        onUpdate={updateEvent}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
      />
    </CalendarContainer>
  );
};

export default Calendar;
