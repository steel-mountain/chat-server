import { users } from "../data/users.js";

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
};

export const disconnect = (socket, io) => {
  console.log("user disconnected");

  const user = Object.values(users)
    .flat()
    .find((user) => user.id === socket.id);

  if (user) {
    logout(user, io);
  }
};
