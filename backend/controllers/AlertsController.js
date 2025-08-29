const Issue = require("../models/jiraissues"); // Jira model
const GoogleSheet = require("../models/googleSheet"); // Google model
const JiraNotification = require("../models/jiraNotification");

// exports.getJiraNotifications = async (req, res) => {
//   try {
//     const notifications = await JiraNotification.find();
//     res.status(200).json({ success: true, notifications });
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     res.status(500).json({ success: false, message: "Server error", error });
//   }
// };


exports.deleteNotification = async (req, res) => {
  try {
    const { id, source, message } = req.body;

    if (!id || !source) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    if (source === "Jira") {
      await Issue.updateOne(
        { _id: id },
        { $pull: { alerts: { message  } } }
      );
    } else if (source === "Google") {
      await GoogleSheet.updateOne(
        { _id: id },
        { $pull: { "ai_predictions.alerts": { message  } } }
      );
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

    const jiraData = issues.reduce((acc, issue) => {
      const alerts = issue.alerts.map((alert) => ({
        _id: issue._id,
        source: "Jira",
        ...alert,
      }));
      acc[issue.project_name] = alerts;
      return acc;
    }, {});

    const googleData = projects.reduce((acc, project) => {
      const projectName = project.source_data?.Project || "Unknown Project";
      const alerts = project.ai_predictions.alerts.map((alert) => ({
        _id: project._id,
        source: "Google",
        ...alert,
      }));
      acc[projectName] = alerts;
      return acc;
    }, {});

    res.json({ success: true, jiraData, googleData });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 