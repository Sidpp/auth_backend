const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");

// Example: Express route handler
exports.requestEmailUpdate = async (req, res) => {
  const { newEmail } = req.body;
  const userId = req.user.id;

  if (!newEmail) {
    return res
      .status(400)
      .json({ success: false, message: "New email is required" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await User.findByIdAndUpdate(userId, {
    pendingEmail: newEmail,
    emailVerificationToken: token,
    emailVerificationTokenExpiry: Date.now() + 3600000,
  });

  const url = `http://localhost:3000/dashboard/settings/profile-management/${token}`;

  await mailSender(
    newEmail,
    "Email Verification",
    `Your Link for new email verification is ${url}. Please click this url to update your email.`
  );

  return res.json({ success: true, message: "Email Verification sent" });
};

exports.verifyNewEmail = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
    return res.json({
      success: false,
      message: "Token is Invalid",
    });
  }
//   if (!(user.emailVerificationTokenExpiry > Date.now())) {
//     return res.status(403).json({
//       success: false,
//       message: `Token is Expired, Please Regenerate Your Token`,
//     });
//   }

  if (!user.pendingEmail) {
    return res.status(400).json({
      success: false,
      message: "No pending email found. Cannot update.",
    });
  }

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save();

  return res.json({ success: true, message: "Email updated successfully!" });
};
