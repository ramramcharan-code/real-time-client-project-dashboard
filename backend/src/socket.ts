import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
   cors: {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
     "https://real-time-client-project-dashboard-p9z0f5hir-charan-831b.vercel.app",
  ],
  credentials: true,
},
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("welcome", {
      message: "Welcome to the Client Dashboard!",
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};