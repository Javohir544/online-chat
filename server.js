import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    socket.on("join-room", (room) => {
        socket.join(room);
    });

    socket.on("message", (data) => {
        io.to(data.room).emit("message", {
            name: data.name,
            text: data.text
        });
    });
});

server.listen(3000, () => {
    console.log("Сайт запущен: http://localhost:3000");
});