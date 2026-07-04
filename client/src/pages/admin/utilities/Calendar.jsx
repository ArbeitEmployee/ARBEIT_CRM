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
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  width: 600px;
  max-width: calc(100% - 32px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
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
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
  color: #334155;
  font-size: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  margin-bottom: 15px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: rgba(248, 250, 252, 0.8);
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #cbd5e1;
    box-shadow: 0 0 0 2px rgba(203, 213, 225, 0.6);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  margin-bottom: 15px;
  padding: 10px 12px;
  min-height: 80px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: rgba(248, 250, 252, 0.8);
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #cbd5e1;
    box-shadow: 0 0 0 2px rgba(203, 213, 225, 0.6);
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
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease-in-out;

  &:not(:last-child) {
    margin-right: 10px;
  }

  &.primary {
    background: linear-gradient(to right, #0f172a, #1e293b);
    color: white;
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);

    &:hover {
      filter: brightness(1.1);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.8);
    color: #334155;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #ffffff;
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
  padding: 24px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
  background: linear-gradient(to bottom right, #f1f5f9, #ffffff);
  color: #0f172a;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 16px 20px;
  border-radius: 24px;
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
`;

const NavButton = styled.button`
  padding: 8px 16px;
  font-size: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
  font-weight: 600;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #0f172a;
  }
`;

const MonthYearDisplay = styled.h2`
  margin: 0 25px;
  min-width: 220px;
  text-align: center;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
`;

const DaysOfWeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
`;

const DayOfWeek = styled.div`
  text-align: center;
  font-weight: 600;
  padding: 12px 0;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const DatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: calc(100vh - 250px); /* Adjusted height */
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 16px;
  border-radius: 24px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
`;

const DateCell = styled.div`
  border: 1px solid rgba(226, 232, 240, 0.7);
  min-height: 100px; /* Increased min-height for better spacing */
  padding: 8px;
  cursor: ${(props) => (props.isClickable ? "pointer" : "default")};
  background-color: ${(props) =>
    props.isToday
      ? "#f0f9ff"
      : props.isCurrentMonth
      ? "rgba(255, 255, 255, 0.6)"
      : "rgba(248, 250, 252, 0.6)"};
  color: ${(props) => (props.isCurrentMonth ? "#0f172a" : "#cbd5e1")};
  border-radius: 12px;
  box-shadow: ${(props) =>
    props.isToday ? "0 0 0 2px #38bdf8" : "0 1px 2px rgba(15, 23, 42, 0.04)"};
  overflow: hidden;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;

  &:hover {
    ${(props) =>
      props.isClickable &&
      `
      background-color: ${props.isToday ? "#e0f2fe" : "rgba(255, 255, 255, 0.9)"};
      transform: translateY(-2px);
      box-shadow: ${
        props.isToday
          ? "0 0 0 2px #38bdf8, 0 8px 16px rgba(15, 23, 42, 0.08)"
          : "0 8px 16px rgba(15, 23, 42, 0.08)"
      };
    `}
  }
`;

const DateNumber = styled.div`
  font-weight: 700;
  font-size: 1.15em;
  margin-bottom: 5px;
  color: ${(props) => (props.isToday ? "#0284c7" : "inherit")};
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
  border-radius: 6px;
  padding: 3px 6px;
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
