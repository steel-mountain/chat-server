import cors from "cors";
import express from "express";
import { createServer } from "http";
import path, { dirname } from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { checkName, disconnect, joinUser, logout, sendMessage, typing } from "./controllers/user.js";

const PORT = process.env.PORT || 5000;

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("checkName", (data, cb) => checkName(data, cb));
  socket.on("join", (user) => joinUser(user, socket, io));
  socket.on("typing", ({ name, room, status }) => typing(name, room, status, socket));
  socket.on("sendMessage", (data) => sendMessage(data, io));
  socket.on("logout", (data) => logout(data, io));
  socket.on("disconnect", () => disconnect(socket, io));
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.send("Hello world"));

server.listen(PORT, (err) => {
  if (err) {
    console.error(`error is: ${err}`);
  }
  console.log(`Server is running on port: ${PORT}`);
});
