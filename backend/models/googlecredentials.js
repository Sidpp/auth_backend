const mongoose = require("mongoose");

const googleCredentialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", 
      required: true,
    },
    spreadsheetId: {
      type: String,
      required: true,
    },
    sheetRange: {
      type: String,
      required: true,
    },

    googleTokens: {
      type: Object,
      required: true,
    },

    rows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GoogleSheet",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoogleCredential", googleCredentialSchema);