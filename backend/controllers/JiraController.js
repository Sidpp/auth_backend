const axios = require("axios");
const jiraissues = require("../models/jiraissues.js");
const User = require("../models/User.js");
const mongoose = require("mongoose");
const Credential = require("../models/jiracredential.js");

exports.markJiraAlertRead = async (req, res) => {
  try {
    const { issueId, alertId } = req.body;

    if (!issueId || !alertId) {
      return res.status(400).json({
        success: false,
        message: "issueId and alertId are required",
      });
    }

    const updatedIssue = await jiraissues.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(issueId), 
        "alerts.alert_id": new mongoose.Types.ObjectId(alertId)  // cast alertId
      },
      { $set: { "alerts.$.readed": true } },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue or alert not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Jira alert marked as read",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error marking Jira alert as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { issueId, alertId, operation } = req.body;

    if (!issueId || !alertId) {
      return res
        .status(400)
        .json({ success: false, message: "issueId and alertId are required" });
    }

    if (!operation) {
      return res
        .status(400)
        .json({ success: false, message: "operation is required" });
    }

    let updateFields = {};
    if (operation === "approved") {
      updateFields = {
        "alerts.$.alertapproved": true,
        "alerts.$.alertrejected": false,
      };
    } else if (operation === "rejected") {
      updateFields = {
        "alerts.$.alertrejected": true,
        "alerts.$.alertapproved": false,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid operation, must be 'approved' or 'rejected'",
      });
    }

    const updatedIssue = await jiraissues.findOneAndUpdate(
  { 
    _id: new mongoose.Types.ObjectId(issueId),
    "alerts.alert_id": new mongoose.Types.ObjectId(alertId)   // cast alertId to ObjectId
  },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedIssue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue or alert not found" });
    }

    res.status(200).json({
      success: true,
      message: `Alert ${operation} successfully`,
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error updating alert status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};

// Controller to mark approved as true and rjected as true
exports.updateIssueStatus = async (req, res) => {
  try {
    const { issueId, operation } = req.body; // get issue ID + operation

    if (!issueId ) {
      return res.status(400).json({ success: false, message: "issueId  are required" });
    }

        if (!operation) {
      return res.status(400).json({ success: false, message: " operation are required" });
    }

    let updateFields = {};

    if (operation === "approved") {
      updateFields = { approved: true, rejected: false };
    } else if (operation === "rejected") {
      updateFields = { rejected: true, approved: false };
    } else {
      return res.status(400).json({ success: false, message: "Invalid operation, must be 'approve' or 'reject'" });
    }

    // Update issue
    const updatedIssue = await jiraissues.findByIdAndUpdate(
      issueId,
      updateFields,
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    res.status(200).json({
      success: true,
      message: `Issue ${operation}d successfully`,
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// GET issue by id
exports.getJiraIssueById = async (req, res) => {
  try {
    const issueId = req.params.id;

    if (!issueId) {
      return res.status(400).json({ error: "Issue ID is required" });
    }

    const issue = await jiraissues.findById(issueId);

    if (!issue) {
      return res.status(404).json({ error: "Jira issue not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Jira issue fetched successfully",
      issue,
    });
  } catch (error) {
    console.error("Error fetching Jira issue by ID:", error.message);
    return res
      .status(500)
      .json({ error: "Server error while fetching Jira issue" });
  }
};

// Get multiple Jira issues by IDs
exports.getJiraIssuesByIds = async (req, res) => {
  try {
    const ids = req.query.ids?.split(",").map(id => id.trim());
    if (!ids || !ids.length) {
      return res.status(400).json({ error: "No Jira IDs provided" });
    }

    // Fetch all issues in a single DB query
    const issues = await jiraissues.find({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      message: "Jira issues fetched successfully",
      issues,
    });
  } catch (error) {
    console.error("Error fetching Jira issues:", error.message);
    return res.status(500).json({ error: "Server error while fetching Jira issues" });
  }
};

// Get all Jira Issues based on assignJiraProject sent in request body
exports.getAllJiraIssuesByAssign = async (req, res) => {
  try {
    const { assignJiraProject } = req.body;

    if (!assignJiraProject || !Array.isArray(assignJiraProject) || assignJiraProject.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No Jira projects provided.",
        issues: [],
      });
    }

    // Build query for all assigned projects
    const query = {
      $or: assignJiraProject.map((proj) => ({
        project_name: proj.jiraProjectName,
       // user_id: proj.jiraProjectCredentials, 
      })),
    };

    // Fetch issues matching the query
    const issues = await jiraissues.find(query);

    return res.status(200).json({
      success: true,
      message: "Jira issues fetched successfully",
      issues,
    });
  } catch (error) {
    console.error("Error fetching Jira issues:", error.message);
    return res.status(500).json({
      error: "Server error while fetching issues",
    });
  }
};


// Get all Jira Issues
exports.getAllJiraIssues = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }
    const credentials = await Credential.findOne({ userid: userId });

    if (!credentials) {
      return res.status(400).json({ error: "Credentials not found " });
    }
    // console.log("data",credentials.issues)

    const issueIds = credentials.issues; // Array of ObjectIds

    if (!issueIds || issueIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No issues linked to this credential.",
        issues: [],
      });
    }

    // ✅ Find all issues with _id in credentials.issues
    const issues = await jiraissues.find({ _id: { $in: issueIds } });

    return res.status(200).json({
      success: true,
      message: "Jira issues fetched successfully from DB.",
      issues,
    });
  } catch (error) {
    console.error("Error fetching Jira issues from DB:", error.message);
    return res
      .status(500)
      .json({ error: "Server error while fetching issues." });
  }
};

// Get assign Jira Issues
exports.getAssignJiraIssues = async (req, res) => {
  try {
    const {userId} = req.body;


    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }
 
    // Cast to ObjectId
    const credentials = await Credential.findOne({
      userid: new mongoose.Types.ObjectId(userId),
    });

    if (!credentials) {
      return res.status(400).json({ error: "Credentials not found " });
    }
    // console.log("data",credentials.issues)

    const issueIds = credentials.issues; // Array of ObjectIds

    if (!issueIds || issueIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No issues linked to this credential.",
        issues: [],
      });
    }

    // ✅ Find all issues with _id in credentials.issues
    const issues = await jiraissues.find({ _id: { $in: issueIds } });

    return res.status(200).json({
      success: true,
      message: "Jira issues fetched successfully from DB.",
      issues,
    });
  } catch (error) {
    console.error("Error fetching Jira issues from DB:", error.message);
    return res
      .status(500)
      .json({ error: "Server error while fetching issues." });
  }
};

// get jira credentials
exports.getJiraCredentials = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }

    const user = await User.findById(userId);

    if (!user || !user.jira_credential_id) {
      return res.status(404).json({
        success: false,
        message: "Jira credentials not found for the user",
      });
    }

    const credentials = await Credential.findById(user.jira_credential_id);

    return res.status(200).json({
      success: true,
      message: "Fetched Jira credentials successfully",
      data: {
        jira_email: credentials.jira_email,
        jira_domain: credentials.jira_domain,
        jira_api_key: credentials.jira_api_key, // Optional: Remove if sensitive
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

// POST connect jira through api
exports.callJiraConnectAPI = async (req, res) => {
  try {
    const { jira_email, jira_domain, jira_api_key } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }

    if (!jira_email || !jira_domain || !jira_api_key) {
      return res.status(400).json({ error: "Missing jira required fields" });
    }

    const jiraApiUrl =
      process.env.JIRA_CONNECT_URL;

    const response = await axios.post(
      `${jiraApiUrl}/api/jira/connect`,
      {
        jira_email,
        jira_domain,
        jira_api_key,
        user_id: userId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}`, // optional if the external API needs token
        },
      }
    );

    res.status(response.status).json({
      success: true,
      message: "Jira connected successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Error calling Jira Connect API:", error.message);

    if (error.response) {
      return res
        .status(error.response.status)
        .json({ error: error.response.data || "API call failed" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
