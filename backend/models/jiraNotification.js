const mongoose = require("mongoose");

const jiraAlertSchema = new mongoose.Schema(
  {
    role: {
      type: String,

    },
   
    message: {
      type: String,
    
    },
  },
  { _id: false } // if this is always embedded in another schema
);

const jiraNotificationSchema = new mongoose.Schema({
  alerts: [jiraAlertSchema], // array of alert objects
});

const JiraNotification = mongoose.model("jiranotification", jiraNotificationSchema);

module.exports = JiraNotification;
