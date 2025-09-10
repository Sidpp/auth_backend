// Importing necessary modules and packages
const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const jiraRoutes = require("./routes/jira");
const googleRoutes = require("./routes/google");
const searchRoutes = require("./routes/search");
const alertsRoutes = require("./routes/alerts");
const feedbackRoutes = require("./routes/feedback");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

//----------------------------------------------------------------
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const JiraNotification = require("./models/jiraissues");
const GoogleSheet = require("./models/googleSheet");
const server = http.createServer(app);

console.log("Running with HTTP server, ready for Nginx proxy.");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://demo.portfolio-vue.com"],
    methods: ["GET", "POST"],
  },

  path: "/socket.io",
});

const { MONGODB_URL } = process.env;

// Connect MongoDB
mongoose.connect(MONGODB_URL);
mongoose.connection.once("open", () => {
  console.log("MongoDB connected ✅");

  // Watch JiraNotification collection
  JiraNotification.watch([], { fullDocument: "updateLookup" }).on(
    "change",
    (change) => {
      console.log("MongoDB Change Jiar Detected:", change.operationType);

      if (change.operationType === "insert") {
        change.fullDocument.alerts.forEach((alert) => {
          io.emit("new-notification", alert); // each alert as one object
        });
      }

      // if (change.operationType === "update") {
      //   const fullIssue = change.fullDocument;
      //   const id = fullIssue?._id;

      //   if (fullIssue?.alerts?.length) {
      //     // check that alerts exist and has length
      //     const latestAlert = fullIssue.alerts[fullIssue.alerts.length - 1];
      //    io.emit("new-notification", {
      //       ...latestAlert,
      //       id,
      //       source: "Jira",
      //     });
      //   }
      // }

      // if (change.operationType === "delete") {
      //   change.fullDocument?.alerts.forEach((alert) => {
      //     io.emit("delete-notification", alert.alert_id);
      //   });
      // }

      // ==================== CORRECTED LOGIC START ====================
      if (change.operationType === "update") {
        const fullIssue = change.fullDocument;
        const id = fullIssue?._id;

        // if (fullIssue?.alerts?.length) {
        //   // Only keep objects that look like real alerts
        //   const validAlerts = fullIssue.alerts.filter(
        //     (a) => a.alert_type && a.message && a.alert_timestamp
        //   );

        //   if (validAlerts.length) {
        //     const lastAlert = validAlerts[validAlerts.length - 1];
        //     const latestTimestamp = lastAlert.alert_timestamp;

        //     const newAlerts = validAlerts.filter(
        //       (a) => a.alert_timestamp === latestTimestamp
        //     );

        //     newAlerts.forEach((alert) => {
        //       console.log("aalerts", alert);
        //       console.log(`Emitting Jira alert for role: ${alert.role}`);
        //       io.emit("new-notification", {
        //         ...alert,
        //         id,
        //         source: "Jira",
        //       });
        //     });
        //   }
        // }

        if (fullIssue?.alerts?.length) {
          const validAlerts = fullIssue.alerts.filter(
            (a) => a.alert_type && a.message && a.alert_timestamp
          );

          if (validAlerts.length) {
            const lastAlert = validAlerts[validAlerts.length - 1];

            // Normalize timestamp to ISO string for comparison
            const latestTimestamp = new Date(
              lastAlert.alert_timestamp
            ).toISOString();

            const newAlerts = validAlerts.filter(
              (a) =>
                new Date(a.alert_timestamp).toISOString() === latestTimestamp
            );

            newAlerts.forEach((alert) => {
              console.log("aalerts", alert);
              console.log(`Emitting Jira alert for role: ${alert.role}`);
              io.emit("new-notification", {
                ...alert,
                id,
                source: "Jira",
              });
            });
          }
        }
      }

      // ===================== CORRECTED LOGIC END =====================
    }
  );

  // Watch JiraNotification collection
  GoogleSheet.watch([], { fullDocument: "updateLookup" }).on(
    "change",
    (change) => {
      console.log("MongoDB Change Google Detected:", change.operationType);

      // if (change.operationType === "insert") {
      //   const alerts = change.fullDocument?.alerts;
      //   if (Array.isArray(alerts) && alerts.length > 0) {
      //     alerts.forEach((alert) => {
      //       io.emit("new-notification", alert);
      //     });
      //   }
      // }

      // if (change.operationType === "update") {
      //   const fullIssue = change.fullDocument;
      //   const id = fullIssue?._id;

      //   if (fullIssue?.ai_predictions?.alerts?.length) {
      //     // check that alerts exist and has length
      //     const latestAlert =
      //       fullIssue.ai_predictions.alerts[
      //         fullIssue.ai_predictions.alerts.length - 1
      //       ];
      //     io.emit("new-notification", {
      //       ...latestAlert,
      //       id,
      //       source: "Google",
      //     });
      //   }
      // }

      // ==================== CORRECTED LOGIC START ====================
      if (change.operationType === "update") {
        const fullIssue = change.fullDocument;
        const id = fullIssue?._id;

        // Check that alerts exist and has length inside the ai_predictions object
        if (fullIssue?.ai_predictions?.alerts?.length) {
          const alertsArray = fullIssue.ai_predictions.alerts;

          // 1. Get the last alert to find the most recent timestamp
          const lastAlert = alertsArray[alertsArray.length - 1];
          const latestTimestamp = lastAlert.alert_timestamp;

          // 2. Filter for all alerts added in the same batch (matching timestamp)
          const newAlerts = alertsArray.filter(
            (alert) => alert.alert_timestamp === latestTimestamp
          );

          // 3. Emit a notification for each new alert
          newAlerts.forEach((alert) => {
            console.log("aalerts", alert);
            console.log(`Emitting Google Sheet alert for role: ${alert.role}`);
            io.emit("new-notification", {
              ...alert,
              id,
              source: "Google",
            });
          });
        }
      }
      // ===================== CORRECTED LOGIC END =====================

      // if (change.operationType === "delete") {
      //   change.fullDocument?.alerts.forEach((alert) => {
      //     io.emit("delete-notification", alert.alert_id);
      //   });
      // }
    }
  );
});
// Socket.io connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
// REST API: get all alerts
app.get("/api/notifications", async (req, res) => {
  try {
    const issues = await JiraNotification.find();
    const alerts = [];

    issues.forEach((issue) => {
      issue.alerts.forEach((alert) => {
        alerts.push(alert.toObject());
      });
    });

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//--------------------------------------------------------------

// Setting up port number
const PORT = process.env.PORT || 5000;

// Loading environment variables from .env file
dotenv.config();

// Connecting to database
database.connect();

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Connecting to cloudinary
cloudinaryConnect();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Setting up routes
app.use("/api/auth", userRoutes);
app.use("/api", jiraRoutes);
app.use("/api", googleRoutes);
app.use("/api", searchRoutes);
app.use("/api", alertsRoutes);
app.use("/api", feedbackRoutes);

// Testing the server
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running ...",
  });
});

// Listening to the server
// app.listen(PORT, () => {
// 	console.log(`App is listening at ${PORT}`);
// });
// New
server.listen(PORT, () => {
  console.log(`Server and Socket.io listening at ${PORT}`);
});
// End of code.
