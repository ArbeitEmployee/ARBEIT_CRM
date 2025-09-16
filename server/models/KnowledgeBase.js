import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"]
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true
  },
  group: {
    type: String,
    required: [true, "Group is required"],
    trim: true,
    maxlength: [50, "Group cannot exceed 50 characters"]
  },
  dateCreated: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty dates
        return /^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4})$/.test(v);
      },
      message: "Date must be in DD-MM-YYYY or MM-DD-YYYY format"
    }
  },
  votes: {
    helpful: { 
      type: Number, 
      default: 0,
      min: [0, "Helpful votes cannot be negative"]
    },
    notHelpful: { 
      type: Number, 
      default: 0,
      min: [0, "Not helpful votes cannot be negative"]
    }
  },
  userVotes: [{
    userId: {
      type: String,
      required: true
    },
    voteType: {
      type: String,
      required: true,
      enum: ['helpful', 'notHelpful']
    },
    votedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Add total votes virtual to JSON output
      ret.votes.total = ret.votes.helpful + ret.votes.notHelpful;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Add total votes virtual to object output
      ret.votes.total = ret.votes.helpful + ret.votes.notHelpful;
      return ret;
    }
  }
});

// Virtual for total votes
knowledgeBaseSchema.virtual('votes.total').get(function() {
  return this.votes.helpful + this.votes.notHelpful;
});

// Add compound indexes for better performance
knowledgeBaseSchema.index({ admin: 1, group: 1 });
knowledgeBaseSchema.index({ admin: 1, createdAt: -1 });
knowledgeBaseSchema.index({ admin: 1, title: 'text', content: 'text' });
knowledgeBaseSchema.index({ "userVotes.userId": 1, "userVotes.votedAt": 1 });

// Instance method to check if user has voted today
knowledgeBaseSchema.methods.hasUserVotedToday = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.userVotes.some(vote => 
    vote.userId === userId && 
    new Date(vote.votedAt) >= today
  );
};

// Instance method to get user's vote for today
knowledgeBaseSchema.methods.getUserVoteToday = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayVote = this.userVotes.find(vote => 
    vote.userId === userId && 
    new Date(vote.votedAt) >= today
  );
  
  return todayVote ? todayVote.voteType : null;
};

// Static method to get articles by admin with vote statistics
knowledgeBaseSchema.statics.getArticlesByAdmin = function(adminId, filters = {}) {
  const pipeline = [
    { $match: { admin: adminId, ...filters } },
    {
      $addFields: {
        'votes.total': { $add: ['$votes.helpful', '$votes.notHelpful'] }
      }
    },
    { $sort: { createdAt: -1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to ensure vote counts are never negative
knowledgeBaseSchema.pre('save', function(next) {
  if (this.votes.helpful < 0) this.votes.helpful = 0;
  if (this.votes.notHelpful < 0) this.votes.notHelpful = 0;
  next();
});

// Post-save middleware to update vote statistics (if needed for analytics)
knowledgeBaseSchema.post('save', function(doc) {
  // You can add analytics tracking here if needed
  console.log(`Article ${doc.title} updated with ${doc.votes.helpful} helpful and ${doc.votes.notHelpful} not helpful votes`);
});

const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);

export default KnowledgeBase;