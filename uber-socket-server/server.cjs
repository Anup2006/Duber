const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

// HTTP server for BOTH socket + express
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ---------------- SOCKET PART ----------------
io.on("connection", (socket) => {
  console.log("SOCKET CONNECTED:", socket.id);

  socket.on("join-ride", (rideId) => {
    socket.join(rideId);
  });

  socket.on("driver-location", (data) => {
    io.to(data.rideId).emit("driver-location", data);
  });

  socket.on("ride-status", (data) => {
    io.to(data.rideId).emit("ride-status", data);
  });

  socket.on("disconnect", () => {
    console.log("DISCONNECTED");
  });
});

// ---------------- HTTP API INSIDE SOCKET SERVER ----------------
app.post("/emit-ride-status", (req, res) => {
  const { rideId, status, driverId, tripOtp } = req.body;

  io.to(rideId).emit("ride-status", {
    rideId,
    status,
    driverId,
    tripOtp,
  });

  console.log("EMITTED FROM SOCKET SERVER:", rideId, status);

  res.json({ success: true });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log("Socket server running on", PORT);
});