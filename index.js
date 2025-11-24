import cors from "cors";
import express from "express";
import fs from "fs/promises";
import { createServer } from "http";
import path, { dirname } from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { checkName, disconnect, joinUser, logout } from "./controllers/user.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("checkName", (data, cb) => checkName(data, cb));
  socket.on("join", (user) => joinUser(user, socket, io));

  socket.on("typing", ({ name, room, status }) => {
    socket.broadcast.to(room).emit("typing", {
      name,
      room,
      status,
    });
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { fileName, dataBuffer, message, params } = data;
      const { name, room } = params;

      if (fileName && dataBuffer) {
        const buffer = Buffer.from(dataBuffer);
        const filePath = path.join(__dirname, "uploads", fileName);

        await fs.writeFile(filePath, buffer);

        console.log("Файл успешно сохранен:", filePath);

        const object = {
          name,
          message,
          url: `/uploads/${fileName}`,
        };

        io.to(room).emit("message", object);
      } else {
        io.to(room).emit("message", {
          name,
          message,
        });
      }
    } catch (error) {
      console.log(`Error is: ${error}`);
    }
  });

  socket.on("logout", (data) => logout(data, io));
  socket.on("disconnect", () => disconnect(socket, io));
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(PORT, (err) => {
  if (err) {
    console.error(`error is: ${err}`);
  }
  console.log(`Server is running on port: ${PORT}`);
});
