import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { users } from "../data/users.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const addUser = ({ name, room, id }) => {
  if (name === "" && room === "") {
    console.log("error in add user!");
  }

  const isUnique = checkUser({ name, room });

  if (users[room] && isUnique) {
    users[room].push({ name, id, room });
  } else {
    users[room] = [{ name, id, room }];
  }
};

export const checkUser = ({ name, room }) => {
  let isUnique = true;

  if (users[room]) {
    users[room].forEach((item) => {
      if (item.name === name) {
        isUnique = false;
      }
    });
  }
  return isUnique;
};

export const checkName = (data, cb) => {
  const { name, room } = data;

  const isUnique = checkUser({ name, room });
  cb(isUnique);
};

export const joinUser = ({ name, room }, socket, io) => {
  addUser({ name, room, id: socket.id });
  socket.join(room);

  socket.emit("message", { name: "Admin", message: `Hello ${name}` });
  io.to(room).emit("users", users[room]);

  socket.broadcast.to(room).emit("message", {
    name: "Admin",
    message: `${name} has join to us`,
  });
};

export const removeUser = (data) => {
  const { room, name } = data;
  if (users[room]) {
    users[room] = users[room]?.filter((user) => user.name !== name);
    users[room].length === 0 && delete users[room];
  }
};

export const logout = (data, io) => {
  const { name, room } = data;
  removeUser(data);

  io.to(room).emit("message", {
    name: "Admin",
    message: `${name} has left`,
  });
  io.to(room).emit("users", users[room]);
  console.log(`user ${name} has disconnected`);
};

export const disconnect = (socket, io) => {
  const user = Object.values(users)
    .flat()
    .find((user) => user.id === socket.id);

  if (user) {
    logout(user, io);
  }
};

export const typing = (name, room, status, socket) => {
  socket.broadcast.to(room).emit("typing", {
    name,
    room,
    status,
  });
};

export const sendMessage = async (data, io) => {
  try {
    const { fileName, dataBuffer, message, params } = data;
    const { name, room } = params;

    if (fileName && dataBuffer) {
      const buffer = Buffer.from(dataBuffer);
      const filePath = path.join(__dirname, "..", "uploads", fileName);

      await fs.writeFile(filePath, buffer);

      console.log("Файл успешно сохранен:", filePath);

      const object = {
        name,
        message,
        url: `/uploads/${fileName}`,
      };

      io.to(room).emit("message", object);
    } else {
      io.to(room).emit("message", { name, message });
    }
  } catch (error) {
    console.log(`Error is: ${error}`);
  }
};
