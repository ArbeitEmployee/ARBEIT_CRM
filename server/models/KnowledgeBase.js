import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema({
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
        return /^((0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4})$/.test(v);
      },
      message: "Date must be in DD-MM-YYYY or MM-DD-YYYY format"
    }
  },
  votes: {
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 }
  },
  userVotes: [{
    userId: String,
    voteType: String, // 'helpful' or 'notHelpful'
    votedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Add indexes for better performance
knowledgeBaseSchema.index({ group: 1 });
knowledgeBaseSchema.index({ dateCreated: 1 });

const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);

export default KnowledgeBase;