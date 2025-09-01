const Issue = require("../models/jiraissues"); // Jira model
const GoogleSheet = require("../models/googleSheet"); // Google model

exports.deleteNotification = async (req, res) => {
  try {
    const { id, source, alert_id } = req.body;

    if (!id || !source || !alert_id) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (source === "Jira") {
      await Issue.updateOne(
        { _id: id },
        { $pull: { alerts: { alert_id } } }   // ✅ match by alert_id
      );
    } else if (source === "Google") {
      await GoogleSheet.updateOne(
        { _id: id },
        { $pull: { "ai_predictions.alerts": { alert_id } } }  // ✅ match by alert_id
      );
    } else {
      return res.status(400).json({ success: false, message: "Invalid source" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
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


 