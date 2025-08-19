const mongoose = require("mongoose");

const AiPredictionsSchema = new mongoose.Schema({
  Risk: String,
  Issues: String,
  Forecasted_Cost: Number,
  Forecasted_Deviation: Number,
  Burnout_Risk: Number,
});

const SourceDataSchema = new mongoose.Schema({
  Program: String,
  Portfolio: String,
  Project_Manager: String,
  Vendor: String,
  Contract_ID: String,
  Contract_Start_Date: String,
  Contract_End_Date: String,
  Contract_Ceiling_Price: String,
  Contract_Target_Price: String,
  Actual_Contract_Spend: String,
  Expiring_Soon: String,
  Resource_Name: String,
  Role: String,
  Allocated_Hours: String,
  Actual_Hours: String,
  Planned_Cost: String,
  Actual_Cost: String,
  Update_Date: String,
  Project: String,
  Burnout_Risk_Percent: String,
  EV_Percent: String,
  PV_Percent: String,
  AC_Dollar: String,
  CPI: String,
  SPI: String,
  Forecasted_Cost: String,
  Forecast_Deviation: String,
  Variance_at_Completion: String,
  Project_Status_RAG: String,
  Milestone_Status: String,
  Risks: String,
  Issues: String,
  Data_Source: String,
  Dependency_Type: String,
  Impacted_Dashboard: String,
});

const ProjectModelSchema = new mongoose.Schema(
  {
    row_index: Number,
    spreadsheet_id: String,
    ai_predictions: AiPredictionsSchema,
    last_processed_at: Date,
    project_identifier: String,
    source_data: SourceDataSchema,
    sync_timestamp: Date,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { collection: "GoogleSheet" }
);

module.exports = mongoose.model("GoogleSheet", ProjectModelSchema);
