import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { addUser, users, removeUser, checkUser } from "./data/users.js";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 5000;
const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("start socket");

  socket.on("checkName", (data, callback) => {
    const { name, room } = data;
    const isUnique = checkUser({ name, room });
    callback(isUnique);
  });

  socket.on("join", ({ name, room }) => {
    addUser({ name, room, id: socket.id });

    socket.join(room);

    socket.emit("message", { name: "Admin", message: `Hello ${name}` });
    console.log(users[room]);
    io.to(room).emit("users", users[room]);

    socket.broadcast.to(room).emit("message", {
      name: "Admin",
      message: `${name} has join to us`,
    });
  });

  socket.on("sendMessage", (data) => {
    const { fileName, dataBuffer, message, params } = data;
    const { name, room } = params;

    if (fileName && dataBuffer) {
      const buffer = Buffer.from(dataBuffer);
      const filePath = path.join(__dirname, "uploads", fileName);

      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error("Ошибка при сохранении файла:", err);
          return;
        }

        console.log("Файл успешно сохранен:", filePath);

        const object = {
          name,
          message,
          url: `/uploads/${fileName}`,
        };

        io.to(room).emit("message", object);
      });
    } else {
      io.to(room).emit("message", {
        name,
        message,
      });
    }
  });

  socket.on("logout", (data) => {
    const { name, room } = data;
    removeUser(data);

    io.to(room).emit("message", {
      name: "Admin",
      message: `${name} has left`,
    });
    io.to(room).emit("users", users[room]);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");

    const user = Object.values(users)
      .flat()
      .find((user) => user.id === socket.id);

    user && removeUser(user);

    console.log(users);
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(PORT, (err) => {
  if (err) {
    console.error(`error is: ${err}`);
  }
  console.log("Server is running on port 5000");
});
