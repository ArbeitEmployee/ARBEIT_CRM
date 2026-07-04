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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="mb-4 text-slate-600">Loading articles...</div>
          <div
            className="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500"
            style={{ animation: "spin 1s linear infinite" }}
          ></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
          <div className="mb-4 text-lg text-red-600">{error}</div>
          <button
            onClick={fetchArticles}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Reports
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          Knowledge Base Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View voting statistics for your knowledge base articles
        </p>
      </div>

      {/* Group Filter */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
        <label
          htmlFor="groupSelect"
          className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
        >
          Choose Group
        </label>
        <select
          id="groupSelect"
          value={selectedGroup}
          onChange={onGroupChange}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {/* Articles List with Vote Bars */}
      <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
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
                className={`pb-3 ${
                  idx === articles.length - 1
                    ? "mb-0"
                    : "mb-6 border-b border-slate-200/70"
                }`}
              >
                {/* Article Info */}
                <div className="mb-4">
                  <h3 className="mb-1 text-base font-semibold text-slate-900">
                    {article.title}
                  </h3>
                  <div className="text-sm text-slate-500">
                    <span className="mr-4">Group: {article.group}</span>
                    <span className="tabular-nums">Total Votes: {total}</span>
                  </div>
                </div>

                {/* Yes Votes Bar */}
                <div className="mb-2">
                  <div className="mb-1 flex justify-between text-sm text-slate-700">
                    <span>Helpful Votes</span>
                    <span className="tabular-nums">{yes} votes</span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-xl bg-slate-100">
                    <div
                      className="flex h-6 items-center justify-center rounded-xl text-xs font-semibold text-white tabular-nums"
                      style={{
                        width: `${Math.max(yesPercent, 2)}%`, // Minimum 2% width for visibility
                        maxWidth: "100%",
                        backgroundColor: "#0ea5e9",
                        transition: "width 0.4s ease",
                      }}
                      aria-label={`${yesPercent.toFixed(1)}% Yes votes`}
                    >
                      {yesPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* No Votes Bar */}
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm text-slate-700">
                    <span>Not Helpful Votes</span>
                    <span className="tabular-nums">{no} votes</span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-xl bg-slate-100">
                    <div
                      className="flex h-6 items-center justify-center rounded-xl text-xs font-semibold text-white tabular-nums"
                      style={{
                        width: `${Math.max(noPercent, 2)}%`, // Minimum 2% width for visibility
                        maxWidth: "100%",
                        backgroundColor: "#ef4444",
                        transition: "width 0.4s ease",
                      }}
                      aria-label={`${noPercent.toFixed(1)}% No votes`}
                    >
                      {noPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Article Stats Summary */}
                {total > 0 && (
                  <div className="rounded-xl bg-slate-50/80 px-3 py-2 text-center text-sm text-slate-600">
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
          <div className="px-4 py-12 text-center">
            <div className="mb-4 text-5xl">📊</div>
            <p className="mb-1 text-lg text-slate-600">
              No articles found for this group.
            </p>
            <p className="text-sm text-slate-400">
              Create knowledge base articles to see voting analytics here.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {articles.length > 0 && (
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 text-center text-sm text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,.08)] backdrop-blur">
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
      <style>{`
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
