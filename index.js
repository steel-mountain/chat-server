import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { addUser, users, removeUser, checkUser } from "./data/users.js";

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
    io.to(room).emit("users", users[room]);

    socket.broadcast.to(room).emit("message", {
      name: "Admin",
      message: `${name} has join to us`,
    });
  });

  socket.on("sendMessage", ({ message, params }) => {
    const { name, room } = params;
    io.to(room).emit("message", {
      name,
      message,
    });
  });

  socket.on("logout", (data) => {
    const { name, room } = data;
    removeUser(data);

    io.to(room).emit("message", {
      name: "Admin",
      message: `${name} has left`,
    });
    io.to(room).emit("users", users[room]);
    console.log(users);
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

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(PORT, (err) => {
  if (err) {
    console.error(`error is: ${err}`);
  }
  console.log("Server is running on port 5000");
});
