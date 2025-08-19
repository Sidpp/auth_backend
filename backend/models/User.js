const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Define the name field with type String, required, and trimmed
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Define the email field with type String, required, and trimmed
    email: {
      type: String,
      required: true,
      trim: true,
    },

    // Define the password field with type String and required
    password: {
      type: String,
      required: true,
    },
    // Define the role field with type String and enum values of "Admin", "Student", or "Visitor"
    role: {
      type: String,
      enum: ["Admin", "User"],
      required: true,
    },
    image: {
      type: String,
    },
    token: {
      type: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    pendingEmail: {
      type: String,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpiry: {
      type: Date,
    },
    resetPasswordExpires: {
      type: Date,
    },
    jira_credential_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "credentials",
    },
    google_credential_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleCredential",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
