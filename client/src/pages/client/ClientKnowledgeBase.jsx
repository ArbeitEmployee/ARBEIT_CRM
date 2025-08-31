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
  const [userId, setUserId] = useState("");

  // Generate a persistent user ID using browser fingerprinting
  useEffect(() => {
    const generateUserId = async () => {
      try {
        // Try to get existing user ID from localStorage
        let storedUserId = localStorage.getItem("kb_user_id");
        
        if (!storedUserId) {
          // Generate a more persistent user ID using browser fingerprint
          const fingerprint = await generateBrowserFingerprint();
          storedUserId = `client_${fingerprint}`;
          localStorage.setItem("kb_user_id", storedUserId);
        }
        
        setUserId(storedUserId);
      } catch {
        // Fallback to random ID if fingerprint fails
        const fallbackId = `client_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        localStorage.setItem("kb_user_id", fallbackId);
        setUserId(fallbackId);
      }
    };

    generateUserId();
  }, []);

  // Simple browser fingerprint generator
  const generateBrowserFingerprint = async () => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency || 'unknown',
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
      ].join('|');
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < components.length; i++) {
        const char = components.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return Math.abs(hash).toString(36);
    } catch {
      throw new Error("Fingerprint generation failed");
    }
  };

  // Fetch articles
  const fetchArticles = async () => {
  try {
    const { data } = await axios.get("http://localhost:5000/api/client/knowledge-base", {
      params: {
        group: selectedGroup !== "All" ? selectedGroup : null,
        search: searchTerm
      }
    });
    setArticles(data.articles || []);
    setFilteredArticles(data.articles || []);
    setGroups(data.groups || ["All"]);
    
    // Fetch user votes for these articles
    if (userId && data.articles.length > 0) {
      fetchUserVotes(data.articles.map(article => article._id));
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
    setArticles([]);
    setFilteredArticles([]);
  }
};

  // Fetch user votes
  const fetchUserVotes = async (articleIds) => {
  try {
    const { data } = await axios.post("http://localhost:5000/api/client/knowledge-base/user-votes", {
      userId,
      articleIds
    });
    setUserVotes(data.userVotes || {});
  } catch (error) {
    console.error("Error fetching user votes:", error);
  }
};

  useEffect(() => {
    if (userId) {
      fetchArticles();
    }
  }, [selectedGroup, searchTerm, userId]);

  // Handle vote
  const handleVote = async (articleId, voteType) => {
    if (!userId) {
      alert("Please wait while we identify your browser...");
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/client/knowledge-base/${articleId}/vote`,
        { voteType, userId }
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
        [articleId]: data.userVote
      }));
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error submitting vote. Please try again.");
    }
  };

  // Filter articles by search term
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
                    className={`flex items-center space-x-1 px-3 py-1 rounded ${
                        userVotes[article._id] === 'helpful'
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700 hover:bg-green-50"
                    }`}
                    >
                    <FaThumbsUp className="text-sm" />
                    <span>Yes ({article.votes?.helpful || 0})</span>
                    </button>
                    
                    <button
                    onClick={() => handleVote(article._id, 'notHelpful')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded ${
                        userVotes[article._id] === 'notHelpful'
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700 hover:bg-red-50"
                    }`}
                    >
                    <FaThumbsDown className="text-sm" />
                    <span>No ({article.votes?.notHelpful || 0})</span>
                    </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No articles found. Try a different search term or category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientKnowledgeBasePage;