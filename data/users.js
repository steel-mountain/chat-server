export let users = [];

export const getTrimStr = (str) => str.trim().toLowerCase();

export const addUser = ({ name, room, id }) => {
  if (name === "" && room === "") {
    console.log("error in add user!");
  }

  const userName = getTrimStr(name);
  const userRoom = getTrimStr(room);

  users.push({ name: userName, room: userRoom, id });
};

export const removeUser = (data) => {
  const { name, room } = data;
  users = users.filter((user) => user.name !== name && user.room !== room);
};

// приложение крашится при закрытие окна в браузере
