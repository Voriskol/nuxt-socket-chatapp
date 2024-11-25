import { Server, type ServerOptions, type Socket } from "socket.io";
import moment from "moment";
import type { H3Event } from "h3";
import type { User } from "../types";
import { userJoin, getRoomUsers } from "./users";

const options: Partial<ServerOptions> = {
  path: "/api/socket.io",
  serveClient: false,
};

export const io = new Server(options);

const botName = "NuxtChatapp Admin";
export function initSocket(event: H3Event) {
  //@ts-ignore
  io.attach(event.node.res.socket?.server);

  io.on("connection", (socket: Socket) => {
    socket.on("joinRoom", (payload: User) => {
      const user = userJoin({ ...payload, id: socket.id });
      socket.join(user.room);

      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
    // Disconnect
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      if (user) {
        socket.broadcast
          .to(user.room)
          .emit(
            "message",
            formatMessage(botName, `${user.username} has left the chat`)
          );

        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });
}

export function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
}