import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on("connection", (socket) => {

    console.log("Подключился:", socket.id);

    socket.on("join-room", (room) => {

        socket.join(room);

        console.log(
            socket.id + " вошёл в комнату: " + room
        );
    });

    socket.on("message", (data) => {

        console.log(
            "Сообщение:",
            data.room,
            data.name,
            data.text
        );

        io.to(data.room).emit("message", {
            name: data.name,
            text: data.text
        });
    });

    socket.on("disconnect", () => {
        console.log("Отключился:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server started on port " + PORT);
});