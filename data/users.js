export let users = {};

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

export const removeUser = (data) => {
  const { room, name } = data;
  if (users[room]) {
    users[room] = users[room]?.filter((user) => user.name !== name);
    users[room].length === 0 && delete users[room];
  }
};
