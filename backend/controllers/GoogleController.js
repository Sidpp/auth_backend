const googlecredentials = require("../models/googlecredentials");
const GoogleSheet = require("../models/googleSheet");
const User = require("../models/User");

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
