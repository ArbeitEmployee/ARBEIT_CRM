import React, { useState } from "react";

const groups = [
  "General",
  "Technical",
  "Sales",
  "Support",
  "Hr",
  "Finance"
];

// Sample data structure for articles with vote counts by group
const articlesData = {
  General: [
    {
      title: "How to get started?",
      yes: 8,
      no: 2
    },
    {
      title: "General FAQ",
      yes: 5,
      no: 5
    }
  ],
  Technical: [
    {
      title: "Troubleshooting Network Issues",
      yes: 15,
      no: 3
    },
    {
      title: "System Requirements for Installation",
      yes: 10,
      no: 5
    }
  ],
  Sales: [
    {
      title: "Nice",
      yes: 1,
      no: 0
    },
    {
      title: "What made you so awfully clever? 'I have.",
      yes: 2,
      no: 7
    },
    {
      title: "The next thing is.",
      yes: 6,
      no: 4
    }
  ],
  Support: [
    {
      title: "How to contact Support",
      yes: 12,
      no: 0
    }
  ],
  Hr: [
    {
      title: "Leave Policy 2024",
      yes: 7,
      no: 3
    }
  ],
  Finance: [
    {
      title: "Expense Reimbursement",
      yes: 9,
      no: 1
    }
  ]
};

export default function KbArticles() {
  const [selectedGroup, setSelectedGroup] = useState("Sales");

  const onGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  // Calculate total votes, percentages and ensure no division by zero
  const getPercent = (num, total) => (total === 0 ? 0 : (num / total) * 100);

  // For UI: striped bars CSS style
  const stripedBarStyle = (color) => ({
    width: "100%",
    backgroundImage:
      `repeating-linear-gradient(
        45deg,
        ${color},
        ${color} 10px,
        ${color === "#007acc" ? "#005fa3" : "#cc0000"} 10px,
        ${color === "#007acc" ? "#005fa3" : "#cc0000"} 20px
      )`,
    borderRadius: "6px",
    height: "1.5rem",
    position: "relative",
    color: "white",
    fontWeight: "600",
    fontSize: "0.85rem",
    textAlign: "center",
    lineHeight: "1.5rem"
  });

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <label htmlFor="groupSelect" style={{ fontWeight: "600", fontSize: "1.1rem", display: "block", marginBottom: 8 }}>
        Choose Group
      </label>
      <select
        id="groupSelect"
        value={selectedGroup}
        onChange={onGroupChange}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 8,
          border: "2px solid #007acc",
          fontSize: "1rem",
          width: "100%",
          maxWidth: 320,
          marginBottom: "1.5rem",
          appearance: "none",
          backgroundColor: "#fff",
          cursor: "pointer"
        }}
      >
        {groups.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>

      {/* List articles with vote bars */}
      <div style={{ backgroundColor: "#f9f9f9", padding: "1rem 1.5rem", borderRadius: 12, boxShadow: "0 1px 5px rgb(0 0 0 / 0.1)" }}>
        {articlesData[selectedGroup] && articlesData[selectedGroup].map(({ title, yes, no }, idx) => {
          const total = yes + no;
          const yesPercent = getPercent(yes, total);
          const noPercent = getPercent(no, total);

          return (
            <div key={idx} style={{ marginBottom: 24, borderBottom: idx === articlesData[selectedGroup].length - 1 ? "none" : "1px solid #ddd", paddingBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "0.95rem", marginBottom: 4 }}>
                <div>{title} <span style={{ fontWeight: "400" }}>(Total: {total})</span></div>
                <div style={{ fontWeight: "400" }}>Yes: {yes}</div>
              </div>
              <div
                style={{
                  ...stripedBarStyle("#007acc"),
                  width: `${yesPercent}%`,
                  maxWidth: "100%",
                  transition: "width 0.4s ease"
                }}
                aria-label={`${yesPercent.toFixed(2)}% Yes votes`}
              >
                {yesPercent.toFixed(2)}%
              </div>
              <div style={{ height: 6 }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "400", fontSize: "0.9rem", marginBottom: 4 }}>
                <div style={{ visibility: "hidden" }}>No label placeholder</div> {/* space holder for alignment */}
                <div>No: {no}</div>
              </div>
              <div
                style={{
                  ...stripedBarStyle("#cc0000"),
                  width: `${noPercent}%`,
                  maxWidth: "100%",
                  backgroundImage:
                    `repeating-linear-gradient(
                        45deg,
                        #cc0000,
                        #cc0000 10px,
                        #990000 10px,
                        #990000 20px
                      )`,
                  color: "white",
                  transition: "width 0.4s ease"
                }}
                aria-label={`${noPercent.toFixed(2)}% No votes`}
              >
                {noPercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
        {!articlesData[selectedGroup] && <p>No articles found for this group.</p>}
      </div>
    </div>
  );
}

