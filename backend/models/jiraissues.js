const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
alert_id: {
  type: String,
  required: true,
},

  role: {
    type: String,
  },
  alert_type: {
    type: String,
  },
  message: {
    type: String,
  },
  action_required: {
    type: String,
  },
  alert_timestamp: {
    type: Date,
    default: Date.now,
  },
  alertapproved: {
    type: Boolean,
  },
  alertrejected: {
    type: Boolean,
  },
  readed: {
    type: Boolean,
  },
});

const jiraIssueSchema = new mongoose.Schema(
  {
    // AI-based delay label: "On Track", "At Risk", or "Delayed"
    ai_delay_label: {
      type: String,
      enum: ["On Track", "At Risk", "Delayed"],
    },

    // AI score representing likelihood of delay (0.00 to 1.00)
    ai_delay_score: {
      type: Number,
      min: 0.0,
      max: 1.0,
    },

    // AI-generated summary of risk
    ai_summary: {
      type: String,
    },

    // AI-based score representing priority (0.00 to 1.00)
    ai_priority_score: {
      type: Number,
      min: 0.0,
      max: 1.0,
    },

    // Project name this issue belongs to
    project_name: {
      type: String,
      required: true,
    },

    // Worklog entries (can contain any structure)
    worklog_entries: {
      type: String,
      required: true,
    },

    // Team assigned to the issue
    team: {
      type: String,
    },

    // Issue summary/description
    summary: {
      type: String,
    },

    // Assignee's name (nullable)
    assignee: {
      type: String,
      default: null,
    },

    // Reporter of the issue
    reporter: {
      type: String,
    },

    // Labels assigned to the issue
    labels: {
      type: [String],
      default: [],
    },

    // Original time estimate (in seconds)
    original_estimate: {
      type: String,
    },

    // Remaining time estimate (in seconds)
    remaining_estimate: {
      type: String,
    },

    // Time logged so far (in seconds)
    time_logged: {
      type: String,
    },

    // Current issue status (e.g. "To Do", "In Progress", "Done")
    status: {
      type: String,
    },

    // Due date (nullable)
    due_date: {
      type: Date,
      default: null,
    },

    // Number of days since last update
    update_inactivity_days: {
      type: String,
    },
    burnout_flag: {
      type: String,
      default: null,
    },

    executive_summary: {
      type: String,
      default: null,
    },

    last_ai_interaction_day: {
      type: Date,
      default: null,
    },

    // Priority level (e.g. "High", "Medium", "Low")
    priority: {
      type: String,
    },
    marker: {
      type: String,
      default: null,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "credentials",
    },
    alerts: [alertSchema],
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// // 🔎 Text index for search
// jiraIssueSchema.index({
//   project_name: "text",
//   summary: "text",
//   assignee: "text",
//   reporter: "text",
//   labels: "text",
//   ai_summary: "text",
//   executive_summary: "text",
// });

// 🔎 Text index including ALL fields
jiraIssueSchema.index({
  ai_delay_label: "text",
  ai_delay_score: "text",
  ai_summary: "text",
  ai_priority_score: "text",
  project_name: "text",
  worklog_entries: "text",
  team: "text",
  summary: "text",
  assignee: "text",
  reporter: "text",
  labels: "text",
  marker: "text",
  original_estimate: "text",
  remaining_estimate: "text",
  time_logged: "text",
  status: "text",
  due_date: "text",
  update_inactivity_days: "text",
  burnout_flag: "text",
  executive_summary: "text",
  last_ai_interaction_day: "text",
  priority: "text",
  user_id: "text",

  "alerts.role": "text",
  "alerts.alert_type": "text",
  "alerts.message": "text",
  "alerts.action_required": "text",
  "alerts.created_at": "text",
});

module.exports = mongoose.model("issues", jiraIssueSchema);
// const JiraIssue = mongoose.model("issues", jiraIssueSchema);
// export default JiraIssue;
