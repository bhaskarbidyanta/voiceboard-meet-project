require("dotenv").config();
const http = require("http");
const connectDB = require("./config/db");
const createApp = require("./app");
const notificationScheduler = require("./services/notificationScheduler");
const socketService = require("./services/socket");

connectDB();

const app = createApp();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize socket.io
socketService.init(server);

// Start background reminder service
notificationScheduler.startReminderService();

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// Export for tests if needed
module.exports = { app, server };
