/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaChevronRight,
  FaTimes,
  FaThumbsUp,
  FaThumbsDown,
  FaFolder,
  FaFileAlt,
  FaArrowLeft,
} from "react-icons/fa";
import axios from "axios";

const ClientKnowledgeBasePage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [groups, setGroups] = useState(["All"]);
  const [userVotes, setUserVotes] = useState({});
  const [clientToken, setClientToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("groups"); // 'groups', 'group-articles', 'article-detail'
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Get client token
  useEffect(() => {
    const token = localStorage.getItem("crm_client_token");
    if (token) {
      setClientToken(token);
    } else {
      console.error("No client token found");
      setLoading(false);
    }
  }, []);

  // Create axios config with authorization header
  const createAxiosConfig = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${clientToken}`,
        "Content-Type": "application/json",
      },
    };
  }, [clientToken]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    if (!clientToken) return;

    try {
      setLoading(true);
      const config = createAxiosConfig();
      const { data } = await axios.get(
        `${API_BASE_URL}/client/knowledge-base`,
        {
          params: {
            group: selectedGroup !== "All" ? selectedGroup : null,
            search: searchTerm,
          },
          ...config,
        }
      );

      setArticles(data.articles || []);
      setFilteredArticles(data.articles || []);

      // Filter out "All" from the groups to prevent duplicates
      const uniqueGroups = [...new Set(data.groups || [])].filter(
        (group) => group !== "All"
      );
      setGroups(["All", ...uniqueGroups]);

      // Fetch user votes for these articles
      if (data.articles && data.articles.length > 0) {
        fetchUserVotes(data.articles.map((article) => article._id));
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        // Redirect to login
        localStorage.removeItem("crm_client_token");
        localStorage.removeItem("crm_client");
        window.location.href = "/client/login";
      } else {
        alert("Error loading articles. Please try again.");
      }
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  }, [clientToken, createAxiosConfig, selectedGroup, searchTerm]);

  // Fetch user votes
  const fetchUserVotes = async (articleIds) => {
    if (!clientToken) return;

    try {
      const config = createAxiosConfig();
      const { data } = await axios.post(
        `${API_BASE_URL}/client/knowledge-base/user-votes`,
        {
          articleIds,
        },
        config
      );
      setUserVotes(data.userVotes || {});
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  // Load articles when dependencies change
  useEffect(() => {
    if (clientToken) {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for search to avoid too many API calls
      const timeout = setTimeout(() => {
        fetchArticles();
      }, 500); // 500ms delay after typing stops

      setSearchTimeout(timeout);

      // Cleanup function
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [selectedGroup, searchTerm, clientToken]);

  // Filter articles by search term (client-side filtering for better UX)
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.group.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  }, [searchTerm, articles]);

  // Handle vote
  const handleVote = async (articleId, voteType) => {
    if (!clientToken) {
      alert("Please login to vote.");
      return;
    }

    // Check if user has already voted today
    if (userVotes[articleId]) {
      alert("You have already voted on this article today.");
      return;
    }

    try {
      const config = createAxiosConfig();
      const { data } = await axios.post(
        `${API_BASE_URL}/client/knowledge-base/${articleId}/vote`,
        { voteType },
        config
      );

      // Update the article with new vote counts
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article._id === articleId
            ? { ...article, votes: data.votes }
            : article
        )
      );

      setFilteredArticles((prevArticles) =>
        prevArticles.map((article) =>
          article._id === articleId
            ? { ...article, votes: data.votes }
            : article
        )
      );

      // Update user votes
      setUserVotes((prev) => ({
        ...prev,
        [articleId]: voteType,
      }));

      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Error voting:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("crm_client_token");
        localStorage.removeItem("crm_client");
        window.location.href = "/client/login";
      } else if (error.response?.status === 403) {
        alert("You can only vote once per day on each article.");
      } else {
        alert("Error submitting vote. Please try again.");
      }
    }
  };

  // Handle group selection
  const handleGroupSelect = (group) => {
    if (group === "All") {
      setSelectedGroup("All");
      setSelectedGroupName("All Articles");
      setView("group-articles");
    } else {
      setSelectedGroup(group);
      setSelectedGroupName(group);
      setView("group-articles");
    }
  };

  // Handle article selection
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setView("article-detail");
  };

  // Go back to groups view
  const goBackToGroups = () => {
    setView("groups");
    setSelectedGroup("All");
    setSearchTerm("");
  };

  // Go back to group articles view
  const goBackToGroupArticles = () => {
    setView("group-articles");
    setSelectedArticle(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-pulse bg-gray-300 h-12 w-12 rounded-full mb-4"></div>
          <div className="text-gray-600 font-medium">
            Loading knowledge base...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col items-center p-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            {(view === "group-articles" || view === "article-detail") && (
              <button
                onClick={
                  view === "article-detail"
                    ? goBackToGroupArticles
                    : goBackToGroups
                }
                className="flex items-center text-gray-600 hover:text-gray-800 mr-3"
              >
                <FaArrowLeft className="mr-1" />
                Back
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {view === "groups" && "Knowledge Base"}
              {view === "group-articles" && selectedGroupName}
              {view === "article-detail" && selectedArticle?.title}
            </h1>
          </div>

          {/* Search - Show in all views except article detail */}
          {view !== "article-detail" && (
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Groups View */}
        {view === "groups" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group}
                  onClick={() => handleGroupSelect(group)}
                  className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg mr-4">
                      <FaFolder className="text-xl text-gray-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {group}
                    </h2>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>
                      {group === "All"
                        ? articles.length
                        : articles.filter((a) => a.group === group).length}{" "}
                      articles
                    </span>
                    <FaChevronRight className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State for Groups View */}
            {filteredArticles.length === 0 && searchTerm && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center mt-8">
                <p className="text-gray-500 mb-2">
                  No articles found matching your search.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        )}

        {/* Group Articles View */}
        {view === "group-articles" && (
          <div className="space-y-4">
            {filteredArticles.filter(
              (a) => selectedGroup === "All" || a.group === selectedGroup
            ).length > 0 ? (
              filteredArticles
                .filter(
                  (a) => selectedGroup === "All" || a.group === selectedGroup
                )
                .map((article) => (
                  <div
                    key={article._id}
                    onClick={() => handleArticleSelect(article)}
                    className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-100 rounded-lg mr-4 mt-1">
                        <FaFileAlt className="text-lg text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {article.content.substring(0, 150)}
                          {article.content.length > 150 ? "..." : ""}
                        </p>
                        {selectedGroup === "All" && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded mt-2">
                            {article.group}
                          </span>
                        )}
                      </div>
                      <FaChevronRight className="text-gray-400 mt-2" />
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  No articles found{" "}
                  {searchTerm ? "matching your search" : "in this category"}.
                </p>
                <button
                  onClick={goBackToGroups}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Back to all categories
                </button>
              </div>
            )}
          </div>
        )}

        {/* Article Detail View */}
        {view === "article-detail" && selectedArticle && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded">
                {selectedArticle.group}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedArticle.title}
            </h2>

            <div className="prose max-w-none text-gray-700 mb-8">
              {selectedArticle.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Voting */}
            <div className="border-t pt-6 mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Was this article helpful?
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleVote(selectedArticle._id, "helpful")}
                  disabled={userVotes[selectedArticle._id]}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    userVotes[selectedArticle._id] === "helpful"
                      ? "bg-green-100 text-green-800"
                      : userVotes[selectedArticle._id]
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-green-50"
                  }`}
                >
                  <FaThumbsUp className="text-sm" />
                  <span>Yes ({selectedArticle.votes?.helpful || 0})</span>
                </button>

                <button
                  onClick={() => handleVote(selectedArticle._id, "notHelpful")}
                  disabled={userVotes[selectedArticle._id]}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    userVotes[selectedArticle._id] === "notHelpful"
                      ? "bg-red-100 text-red-800"
                      : userVotes[selectedArticle._id]
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-red-50"
                  }`}
                >
                  <FaThumbsDown className="text-sm" />
                  <span>No ({selectedArticle.votes?.notHelpful || 0})</span>
                </button>
              </div>

              {/* Show voting status */}
              {userVotes[selectedArticle._id] && (
                <p className="text-xs text-gray-500 mt-3">
                  You voted this article as{" "}
                  <span className="font-medium">
                    {userVotes[selectedArticle._id] === "helpful"
                      ? "helpful"
                      : "not helpful"}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientKnowledgeBasePage;
