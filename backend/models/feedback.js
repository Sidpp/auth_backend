const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    feedback: {
      type: String,
    },
    for: {
      type: String,
    },
    ai_summary: {
      type: String,
    },
    isChecked: {
      type: String,
      default: false,
    },
    source: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
