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
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
