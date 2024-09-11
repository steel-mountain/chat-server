import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { addUser, users, removeUser, getTrimStr } from "./data/users.js";

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
    let isUnique = true;

    users.forEach((item) => {
      if (
        getTrimStr(item.room) === getTrimStr(room) &&
        getTrimStr(item.name) === getTrimStr(name)
      ) {
        isUnique = false;
      }
    });
    console.log(users);
    callback(isUnique);
  });

  socket.on("join", ({ name, room }) => {
    addUser({ name, room, id: socket.id });

    socket.join(room);

    socket.emit("message", { name: "Admin", message: `Hello ${name}` });

    socket.broadcast
      .to(room)
      .emit("message", { name: "Admin", message: `${name} has join to us` });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const user = users.find((user) => user.id === socket.id);
    if (user) {
      removeUser(user);
    }
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
