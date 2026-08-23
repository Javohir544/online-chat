import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"), (err) => {
    if (err) console.error("Ошибка открытия БД", err.message);
    else console.log("Подключено к базе данных SQLite.");
});

db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT,
    name TEXT,
    text TEXT,
    time TEXT
)`);

io.on("connection", (socket) => {
    console.log("Подключился пользователь:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`${socket.id} вошёл в комнату: ${room}`);

        db.all(
            `SELECT name, text, time FROM messages WHERE room = ? ORDER BY id ASC`,
            [room],
            (err, rows) => {
                if (!err) {
                    socket.emit("load-history", rows);
                }
            }
        );
    });

    socket.on("message", (data) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = {
            room: data.room,
            name: data.name,
            text: data.text,
            time: time
        };

        db.run(
            `INSERT INTO messages (room, name, text, time) VALUES (?, ?, ?, ?)`,
            [messageData.room, messageData.name, messageData.text, messageData.time],
            (err) => {
                if (err) {
                    console.error("Ошибка сохранения сообщения", err.message);
                    return;
                }
                io.to(data.room).emit("message", messageData);
            }
        );
    });

    // Обработка статуса "печатает"
    socket.on("typing", (data) => {
        socket.to(data.room).emit("typing", data.name);
    });

    socket.on("stop-typing", (data) => {
        socket.to(data.room).emit("stop-typing");
    });

    socket.on("disconnect", () => {
        console.log("Отключился:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server started on port " + PORT);
});