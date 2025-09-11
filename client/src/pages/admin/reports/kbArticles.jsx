import React, { useState, useEffect } from "react";
import axios from "axios";

const groups = [
  "All",
  "General",
  "Technical",
  "Sales",
  "Support",
  "HR",
  "Finance"
];

export default function KbArticles() {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState("");

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('crm_token');
  };

  // Get admin ID from localStorage
  useEffect(() => {
    const adminData = localStorage.getItem('crm_admin');
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdminId(parsedAdmin.id || "");
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }
  }, []);

  // Create axios instance with auth headers
  const createAxiosConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const onGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const config = createAxiosConfig();
      const { data } = await axios.get("http://localhost:5000/api/knowledge-base", {
        params: {
          group: selectedGroup !== "All" ? selectedGroup : null,
          adminId: adminId // Filter by admin ID
        },
        ...config
      });
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/admin/login";
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminId) {
      fetchArticles();
    }
  }, [selectedGroup, adminId]);

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

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading articles...</p>
        </div>
      ) : (
        /* List articles with vote bars */
        <div style={{ backgroundColor: "#f9f9f9", padding: "1rem 1.5rem", borderRadius: 12, boxShadow: "0 1px 5px rgb(0 0 0 / 0.1)" }}>
          {articles.length > 0 ? (
            articles.map((article, idx) => {
              const yes = article.votes?.helpful || 0;
              const no = article.votes?.notHelpful || 0;
              const total = yes + no;
              const yesPercent = getPercent(yes, total);
              const noPercent = getPercent(no, total);

              return (
                <div key={article._id} style={{ marginBottom: 24, borderBottom: idx === articles.length - 1 ? "none" : "1px solid #ddd", paddingBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "0.95rem", marginBottom: 4 }}>
                    <div>{article.title} <span style={{ fontWeight: "400" }}>(Total: {total})</span></div>
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
            })
          ) : (
            <p style={{ textAlign: "center", padding: "2rem" }}>No articles found for this group.</p>
          )}
        </div>
      )}
    </div>
  );
}