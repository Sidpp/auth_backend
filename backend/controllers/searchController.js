const JiraIssue = require("../models/jiraissues");
const GoogleSheet = require("../models/googleSheet");

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.body || {};;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query required" });
    }

    // Jira Issues Search
    const jiraResults = await JiraIssue.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    // GoogleSheet Search
    const googleResults = await GoogleSheet.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    res.json({
      query,
      jira: jiraResults,
      google: googleResults,
    });
  } catch (err) {
    console.error("Global search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
