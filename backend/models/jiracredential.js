const mongoose = require("mongoose")
const CredentialSchema = new mongoose.Schema({
  jira_email: { type: String, required: true },
  jira_domain: { type: String, required: true },
  jira_api_key: { type: String, required: true, select: false },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
 
  issues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }] 
}, {
  timestamps: true 
});

module.exports = mongoose.model('credentials', CredentialSchema);

// const Credential = mongoose.model('credentials', CredentialSchema);
// export default Credential;
