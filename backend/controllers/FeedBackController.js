const Feedback = require("../models/feedback"); // adjust the path if needed

// Create a new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { userid, feedback, for: feedbackFor } = req.body;

    // Validate required fields
    if (!userid || !feedback || !feedbackFor) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newFeedback = new Feedback({
      userid,
      feedback,
      for: feedbackFor,
    });

    const savedFeedback = await newFeedback.save();

    return res.status(201).json({
      success: true,
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
