import { useState, useEffect } from "react";
import { FaSearch, FaChevronRight, FaTimes, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import axios from "axios";

const ClientKnowledgeBasePage = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [groups, setGroups] = useState(["All"]);
  const [userVotes, setUserVotes] = useState({});
  const [clientToken, setClientToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Get client token
  useEffect(() => {
    const token = localStorage.getItem("crm_client_token");
    if (token) {
      setClientToken(token);
    } else {
      console.error("No client token found");
    }
  }, []);

  // Create axios config with authorization header
  const createAxiosConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch articles
  const fetchArticles = async () => {
    if (!clientToken) return;
    
    try {
      setLoading(true);
      const config = createAxiosConfig();
      const { data } = await axios.get("http://localhost:5000/api/client/knowledge-base", {
        params: {
          group: selectedGroup !== "All" ? selectedGroup : null,
          search: searchTerm
        },
        ...config
      });
      
      setArticles(data.articles || []);
      setFilteredArticles(data.articles || []);
      setGroups(data.groups || ["All"]);
      
      // Fetch user votes for these articles
      if (data.articles && data.articles.length > 0) {
        fetchUserVotes(data.articles.map(article => article._id));
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
  };

  // Fetch user votes
  const fetchUserVotes = async (articleIds) => {
    if (!clientToken) return;
    
    try {
      const config = createAxiosConfig();
      const { data } = await axios.post("http://localhost:5000/api/client/knowledge-base/user-votes", {
        articleIds
      }, config);
      setUserVotes(data.userVotes || {});
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  // Load articles when dependencies change
  useEffect(() => {
    if (clientToken) {
      fetchArticles();
    }
  }, [selectedGroup, searchTerm, clientToken]);

  // Filter articles by search term (client-side filtering for better UX)
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article =>
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
        `http://localhost:5000/api/client/knowledge-base/${articleId}/vote`,
        { voteType },
        config
      );
      
      // Update the article with new vote counts
      setArticles(prevArticles => 
        prevArticles.map(article => 
          article._id === articleId 
            ? { ...article, votes: data.votes } 
            : article
        )
      );
      
      setFilteredArticles(prevArticles => 
        prevArticles.map(article => 
          article._id === articleId 
            ? { ...article, votes: data.votes } 
            : article
        )
      );
      
      // Update user votes
      setUserVotes(prev => ({
        ...prev,
        [articleId]: voteType
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Knowledge Base Articles</h1>
        <p className="text-gray-600 mb-4">Have a question?</p>
        
        {/* Search */}
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Group Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-2 rounded-lg ${
                selectedGroup === group
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-100"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <div key={article._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {article.group}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-3">{article.title}</h2>
              
              <div className="text-gray-600 mb-4">
                <p>{article.content.length > 200 
                  ? `${article.content.substring(0, 200)}...` 
                  : article.content}</p>
              </div>
              
              {/* Voting */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600 mb-2">Did you find this article useful?</p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(article._id, 'helpful')}
                    disabled={userVotes[article._id]} // Disable if already voted
                    className={`flex items-center space-x-1 px-3 py-1 rounded ${
                      userVotes[article._id] === 'helpful'
                        ? "bg-green-100 text-green-800"
                        : userVotes[article._id]
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    <FaThumbsUp className="text-sm" />
                    <span>Yes ({article.votes?.helpful || 0})</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(article._id, 'notHelpful')}
                    disabled={userVotes[article._id]} // Disable if already voted
                    className={`flex items-center space-x-1 px-3 py-1 rounded ${
                      userVotes[article._id] === 'notHelpful'
                        ? "bg-red-100 text-red-800"
                        : userVotes[article._id]
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-red-50"
                    }`}
                  >
                    <FaThumbsDown className="text-sm" />
                    <span>No ({article.votes?.notHelpful || 0})</span>
                  </button>
                </div>
                
                {/* Show voting status */}
                {userVotes[article._id] && (
                  <p className="text-xs text-gray-500 mt-2">
                    You voted: {userVotes[article._id] === 'helpful' ? 'Helpful' : 'Not Helpful'}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {articles.length === 0 ? "No articles available yet." : "No articles match your search."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-blue-500 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientKnowledgeBasePage;