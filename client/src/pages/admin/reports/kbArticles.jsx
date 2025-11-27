/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";

const groups = [
  "All",
  "General",
  "Technical",
  "Sales",
  "Support",
  "HR",
  "Finance",
];

export default function KbArticles() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const onGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const config = createAxiosConfig();
      const { data } = await axios.get(`${API_BASE_URL}/knowledge-base`, {
        params: {
          group: selectedGroup !== "All" ? selectedGroup : null,
        },
        ...config,
      });
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
      } else {
        setError("Failed to fetch articles. Please try again.");
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedGroup]);

  // Calculate total votes, percentages and ensure no division by zero
  const getPercent = (num, total) => (total === 0 ? 0 : (num / total) * 100);

  // For UI: striped bars CSS style
  const stripedBarStyle = (color) => ({
    width: "100%",
    backgroundImage: `repeating-linear-gradient(
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
    lineHeight: "1.5rem",
  });

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "2rem auto",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>Loading articles...</div>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #007acc",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "2rem auto",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{ color: "#cc0000", fontSize: "1.1rem", marginBottom: "1rem" }}
        >
          {error}
        </div>
        <button
          onClick={fetchArticles}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007acc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingLeft: "2rem",
        margin: "2rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "0.5rem",
          }}
        >
          Knowledge Base Analytics
        </h1>
        <p style={{ color: "#666", fontSize: "1rem" }}>
          View voting statistics for your knowledge base articles
        </p>
      </div>

      {/* Group Filter */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          htmlFor="groupSelect"
          style={{
            fontWeight: "600",
            fontSize: "1.1rem",
            display: "block",
            marginBottom: 8,
          }}
        >
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
            appearance: "none",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {/* Articles List with Vote Bars */}
      <div
        style={{
          backgroundColor: "#f9f9f9",
          padding: "1rem 1.5rem",
          borderRadius: 12,
          boxShadow: "0 1px 5px rgb(0 0 0 / 0.1)",
        }}
      >
        {articles.length > 0 ? (
          articles.map((article, idx) => {
            const yes = article.votes?.helpful || 0;
            const no = article.votes?.notHelpful || 0;
            const total = yes + no;
            const yesPercent = getPercent(yes, total);
            const noPercent = getPercent(no, total);

            return (
              <div
                key={article._id}
                style={{
                  marginBottom: 24,
                  borderBottom:
                    idx === articles.length - 1 ? "none" : "1px solid #ddd",
                  paddingBottom: 12,
                }}
              >
                {/* Article Info */}
                <div style={{ marginBottom: "1rem" }}>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {article.title}
                  </h3>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    <span style={{ marginRight: "1rem" }}>
                      Group: {article.group}
                    </span>
                    <span>Total Votes: {total}</span>
                  </div>
                </div>

                {/* Yes Votes Bar */}
                <div style={{ marginBottom: "0.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                      marginBottom: 4,
                      color: "#333",
                    }}
                  >
                    <span>Helpful Votes</span>
                    <span>{yes} votes</span>
                  </div>
                  <div
                    style={{
                      ...stripedBarStyle("#007acc"),
                      width: `${Math.max(yesPercent, 2)}%`, // Minimum 2% width for visibility
                      maxWidth: "100%",
                      transition: "width 0.4s ease",
                      minHeight: "1.5rem",
                    }}
                    aria-label={`${yesPercent.toFixed(1)}% Yes votes`}
                  >
                    {yesPercent.toFixed(1)}%
                  </div>
                </div>

                {/* No Votes Bar */}
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                      marginBottom: 4,
                      color: "#333",
                    }}
                  >
                    <span>Not Helpful Votes</span>
                    <span>{no} votes</span>
                  </div>
                  <div
                    style={{
                      ...stripedBarStyle("#cc0000"),
                      width: `${Math.max(noPercent, 2)}%`, // Minimum 2% width for visibility
                      maxWidth: "100%",
                      backgroundImage: `repeating-linear-gradient(
                            45deg,
                            #cc0000,
                            #cc0000 10px,
                            #990000 10px,
                            #990000 20px
                          )`,
                      color: "white",
                      transition: "width 0.4s ease",
                      minHeight: "1.5rem",
                    }}
                    aria-label={`${noPercent.toFixed(1)}% No votes`}
                  >
                    {noPercent.toFixed(1)}%
                  </div>
                </div>

                {/* Article Stats Summary */}
                {total > 0 && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      textAlign: "center",
                      padding: "0.5rem",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "4px",
                    }}
                  >
                    {yesPercent > noPercent
                      ? `👍 This article is helpful (${yesPercent.toFixed(
                          1
                        )}% positive)`
                      : noPercent > yesPercent
                      ? `👎 This article needs improvement (${noPercent.toFixed(
                          1
                        )}% negative)`
                      : "📊 Mixed feedback received"}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}
            >
              No articles found for this group.
            </p>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Create knowledge base articles to see voting analytics here.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {articles.length > 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#e8f4f8",
            borderRadius: "8px",
            fontSize: "0.9rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          <p>
            💡 <strong>Tip:</strong> Articles with low helpful votes may need
            content updates or clarification.
          </p>
          <p>
            Clients can vote once per day on each article to help improve your
            knowledge base.
          </p>
        </div>
      )}

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
