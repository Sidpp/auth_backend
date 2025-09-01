const googlecredentials = require("../models/googlecredentials");
const GoogleSheet = require("../models/googleSheet");
const User = require("../models/User");

// Mark Google alert as read
exports.markGoogleAlertRead = async (req, res) => {
  try {
    const { projectId, alertId } = req.body;

    if (!projectId || !alertId) {
      return res.status(400).json({
        success: false,
        message: "projectId and alertId are required",
      });
    }

    const updatedProject = await GoogleSheet.findOneAndUpdate(
      {
        _id: projectId,
        "ai_predictions.alerts.alert_id": alertId, // match alert_id, not _id
      },
      { $set: { "ai_predictions.alerts.$.readed": true } }, // update readed flag
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project or alert not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Google alert marked as read",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error marking Google alert as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};


exports.updateGoogleAlertStatus = async (req, res) => {
  try {
    const { projectId, alertId, operation } = req.body; 
    // projectId = GoogleSheet document _id
    // alertId = alert _id inside ai_predictions.alerts
    // operation = "approved" | "rejected"

    if (!projectId || !alertId) {
      return res.status(400).json({
        success: false,
        message: "projectId and alertId are required",
      });
    }

    if (!operation) {
      return res.status(400).json({
        success: false,
        message: "operation is required",
      });
    }

    let updateFields = {};
    if (operation === "approved") {
      updateFields = {
        "ai_predictions.alerts.$.alertapproved": true,
        "ai_predictions.alerts.$.alertrejected": false,
      };
    } else if (operation === "rejected") {
      updateFields = {
        "ai_predictions.alerts.$.alertrejected": true,
        "ai_predictions.alerts.$.alertapproved": false,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid operation, must be 'approved' or 'rejected'",
      });
    }

    // Find and update the alert inside ai_predictions.alerts
    const updatedProject = await GoogleSheet.findOneAndUpdate(
      { _id: projectId, "ai_predictions.alerts._id": alertId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project or alert not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Google alert ${operation} successfully`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating Google alert status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

exports.updateGoogleIssueStatus = async (req, res) => {
  try {
    const { projectId, operation } = req.body; // projectId = _id of GoogleSheet doc

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "projectId is required" });
    }

    if (!operation) {
      return res
        .status(400)
        .json({ success: false, message: "operation is required" });
    }

    let updateFields = {};

    if (operation === "approved") {
      updateFields = { "ai_predictions.approved": true, "ai_predictions.rejected": false };
    } else if (operation === "rejected") {
      updateFields = { "ai_predictions.rejected": true, "ai_predictions.approved": false };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid operation, must be 'approved' or 'rejected'",
      });
    }

    // Update GoogleSheet document
    const updatedProject = await GoogleSheet.findByIdAndUpdate(
      projectId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: `Project ${operation}d successfully`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating Google issue status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};


//GET google data by id
exports.getGoogleSheetById = async (req, res) => {
  try {
    const sheetId = req.params.id;

    if (!sheetId) {
      return res.status(400).json({ error: "Google Sheet ID is required" });
    }

    const sheet = await GoogleSheet.findById(sheetId);

    if (!sheet) {
      return res.status(404).json({ error: "Google Sheet not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Google Sheet fetched successfully",
      sheet,
    });
  } catch (error) {
    console.error("Error fetching Google Sheet by ID:", error.message);
    return res.status(500).json({
      error: "Server error while fetching Google Sheet",
    });
  }
};

// GET all data by user
exports.getAllGoogleDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }
    const credentials = await googlecredentials.findOne({ userId: userId });

    if (!credentials) {
      return res.status(400).json({ error: "Credentials not found " });
    }

    const issueIds = credentials.rows;

    if (!issueIds || issueIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No issues linked to this credential.",
        issues: [],
      });
    }

    // Find all issues with _id in credentials.issues
    const issues = await GoogleSheet.find({ _id: { $in: issueIds } });

    return res.status(200).json({
      success: true,
      message: "Jira issues fetched successfully from DB.",
      data: issues,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



// // GET all data
// exports.getAllGoogleDetails = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const projects = await GoogleSheet.find();

//     res.status(200).json({
//       success: true,
//       data: projects,
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//     });
//   }
// };

// GET google credentials
exports.getGoogleCredentials = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }

    const user = await User.findById(userId);

    if (!user || !user.google_credential_id) {
      return res.status(404).json({
        success: false,
        message: "Jira credentials not found for the user",
      });
    }

    const credentials = await googlecredentials.findById(
      user.google_credential_id
    );

    return res.status(200).json({
      success: true,
      message: "Fetched Google credentials successfully",
      data: {
        spreadsheetId: credentials.spreadsheetId,
        sheetRange: credentials.sheetRange,
      },
    });
  } catch (error) {
    console.error("Error fetching Jira credentials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
