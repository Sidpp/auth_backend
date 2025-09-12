const Issue = require("../models/jiraissues");
const GoogleSheet = require("../models/googleSheet");
const Credential = require("../models/jiracredential.js");
const googlecredentials = require("../models/googlecredentials");
const User = require("../models/User");
const mongoose = require("mongoose")


// Bulk mark alerts (Jira + Google) as read
exports.markAllAlertsRead = async (req, res) => {
  try {
    const { jiraAlerts = [], googleAlerts = [] } = req.body;
    // jiraAlerts: [{ issueId, alertId }]
    // googleAlerts: [{ projectId, alertId }]

    if (!jiraAlerts.length && !googleAlerts.length) {
      return res.status(400).json({
        success: false,
        message: "No alerts provided",
      });
    }

    const jiraResults = [];
    const googleResults = [];

    // ---- Bulk update Jira alerts ----
    for (const { issueId, alertId } of jiraAlerts) {
      if (!issueId || !alertId) continue;

      const updatedIssue = await Issue.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(issueId),
          "alerts.alert_id": new mongoose.Types.ObjectId(alertId),
        },
        { $set: { "alerts.$.readed": true } },
        { new: true }
      );

      if (updatedIssue) {
        jiraResults.push({ issueId, alertId, status: "updated" });
      } else {
        jiraResults.push({ issueId, alertId, status: "not found" });
      }
    }

    // ---- Bulk update Google alerts ----
    for (const { projectId, alertId } of googleAlerts) {
      if (!projectId || !alertId) continue;

      const updatedProject = await GoogleSheet.findOneAndUpdate(
        {
          _id: projectId,
          "ai_predictions.alerts.alert_id": alertId,
        },
        { $set: { "ai_predictions.alerts.$.readed": true } },
        { new: true }
      );

      if (updatedProject) {
        googleResults.push({ projectId, alertId, status: "updated" });
      } else {
        googleResults.push({ projectId, alertId, status: "not found" });
      }
    }

    res.status(200).json({
      success: true,
      message: "Alerts processed",
      results: {
        jira: jiraResults,
        google: googleResults,
      },
    });
  } catch (error) {
    console.error("Error marking alerts as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};



exports.deleteNotification = async (req, res) => {
  try {
    const { id, source, alert_id } = req.body;

    if (!id || !source || !alert_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (source === "Jira") {
      await Issue.updateOne(
        { _id: id },
        { $pull: { alerts: { alert_id } } } // ✅ match by alert_id
      );
    } else if (source === "Google") {
      await GoogleSheet.updateOne(
        { _id: id },
        { $pull: { "ai_predictions.alerts": { alert_id } } } // ✅ match by alert_id
      );
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid source" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllAlertsByUserId = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "userid required" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Credential IDs already stored on user
    const jira_id = user.jira_credential_id?.toString() || null;
    const google_id = user.google_credential_id?.toString() || null;

    // --- Fetch Alerts ---
    const [issues, projects] = await Promise.all([
      jira_id
        ? Issue.find(
            { user_id: jira_id, alerts: { $exists: true, $ne: [] } },
            { project_name: 1, alerts: 1 }
          ).lean()
        : [],
      google_id
        ? GoogleSheet.find(
            {
              connectionId: google_id,
              "ai_predictions.alerts": { $exists: true, $ne: [] },
            },
            {
              "source_data.Project": 1,
        "source_data.Program Manager": 1,
        "source_data.Portfolio Manager": 1,
        "source_data.Project Manager": 1,
              "ai_predictions.alerts": 1,
            }
          ).lean()
        : [],
    ]);

    // --- Flatten Jira Alerts ---
    const jiraAlerts = issues.flatMap((issue) =>
      issue.alerts.map((alert) => ({
        _id: issue._id,
        source: "Jira",
        project: issue.project_name,
        ...alert,
        timestamp: alert.alert_timestamp || alert.timestamp,
      }))
    );

    // --- Flatten Google Alerts ---
    const googleAlerts = projects.flatMap((project) =>
      project.ai_predictions.alerts.map((alert) => ({
        _id: project._id,
        source: "Google",
        project: project.source_data?.Project || "Unknown Project",
    portfolioManager: project.source_data?.["Portfolio Manager"] || "Unknown",
    projectManager: project.source_data?.["Project Manager"] || "Unknown",
    programManager: project.source_data?.["Program Manager"] || "Unknown",

        ...alert,
        timestamp: alert.alert_timestamp || alert.timestamp,
      }))
    );

    // --- Merge & Sort ---
    const allAlerts = [...jiraAlerts, ...googleAlerts].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({ success: true, alerts: allAlerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAssignAlerts = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "userid required " });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const jiraUserId = user.jiraProjectAuthor;
    const googleUserId = user.googleProjectAuthor;

    let jira_id = null;
    let google_id = null;

    // --- Jira ---
    if (jiraUserId) {
      const jiraCredentials = await Credential.findOne({ userid: jiraUserId });
      jira_id = jiraCredentials?._id || null;
    }

    // --- Google ---
    if (googleUserId) {
      const googleCredentials = await googlecredentials.findOne({
        userId: googleUserId,
      });
      google_id = googleCredentials?._id || null;
    }

    // --- Alerts ---
    const [issues, projects] = await Promise.all([
      jira_id
        ? Issue.find(
            { user_id: jira_id, alerts: { $exists: true, $ne: [] } },
            { project_name: 1, alerts: 1 }
          ).lean()
        : [],
      google_id
        ? GoogleSheet.find(
            {
              connectionId: google_id,
              "ai_predictions.alerts": { $exists: true, $ne: [] },
            },
            { "source_data.Project": 1, "ai_predictions.alerts": 1 }
          ).lean()
        : [],
    ]);

    // Flatten Jira alerts
    const jiraAlerts = issues.flatMap((issue) =>
      issue.alerts.map((alert) => ({
        _id: issue._id,
        source: "Jira",
        project: issue.project_name,
        ...alert,
        timestamp: alert.alert_timestamp || alert.timestamp, // normalize
      }))
    );

    // Flatten Google alerts
    const googleAlerts = projects.flatMap((project) =>
      project.ai_predictions.alerts.map((alert) => ({
        _id: project._id,
        source: "Google",
        project: project.source_data?.Project || "Unknown Project",
        ...alert,
        timestamp: alert.alert_timestamp || alert.timestamp,
      }))
    );

    // Merge & sort
    const allAlerts = [...jiraAlerts, ...googleAlerts].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({ success: true, alerts: allAlerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllAlerts = async (req, res) => {
  try {
    const [issues, projects] = await Promise.all([
      Issue.find(
        { alerts: { $exists: true, $ne: [] } },
        { project_name: 1, alerts: 1 }
      ).lean(),
      GoogleSheet.find(
        { "ai_predictions.alerts": { $exists: true, $ne: [] } },
        { "source_data.Project": 1, "ai_predictions.alerts": 1 }
      ).lean(),
    ]);

    // Flatten Jira alerts
    const jiraAlerts = issues.flatMap((issue) =>
      issue.alerts.map((alert) => ({
        _id: issue._id,
        source: "Jira",
        project: issue.project_name, // keep if needed for reference
        ...alert,
        timestamp: alert.alert_timestamp, // normalize key
      }))
    );

    // Flatten Google alerts
    const googleAlerts = projects.flatMap((project) =>
      project.ai_predictions.alerts.map((alert) => ({
        _id: project._id,
        source: "Google",
        project: project.source_data?.Project || "Unknown Project",
        ...alert,
        timestamp: alert.timestamp, // normalize key
      }))
    );

    // Merge both and sort by latest timestamp
    const allAlerts = [...jiraAlerts, ...googleAlerts].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({ success: true, alerts: allAlerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
