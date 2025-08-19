//import axios from "axios";
// import jiraissues from "../models/jiraissues.js";
// import User from "../models/User.js";
// import Credential from "../models/jiracredential.js";
const axios = require("axios");
const jiraissues = require("../models/jiraissues.js")
const User = require("../models/User.js");
const Credential = require("../models/jiracredential.js")


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

    const response = await axios.post(
      "http://52.203.116.212:8000/api/jira/connect",
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
