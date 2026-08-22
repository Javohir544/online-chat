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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});