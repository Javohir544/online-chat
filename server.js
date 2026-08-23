import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Путь к файлу с историей сообщений
const dbFile = path.join(__dirname, "messages.json");

// Функция чтения истории
function getHistory() {
    try {
        if (fs.existsSync(dbFile)) {
            const data = fs.readFileSync(dbFile, "utf8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Ошибка чтения истории:", e);
    }
    return [];
}

// Функция сохранения истории
function saveMessageToHistory(messageData) {
    try {
        const history = getHistory();
        history.push(messageData);
        // Сохраняем последние 100 сообщений, чтобы файл не рос бесконечно
        if (history.length > 100) {
            history.shift();
        }
        fs.writeFileSync(dbFile, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("Ошибка сохранения истории:", e);
    }
}

io.on("connection", (socket) => {
    console.log("Подключился пользователь:", socket.id);

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`${socket.id} вошёл в комнату: ${room}`);

        // Отправляем историю конкретной комнаты
        const history = getHistory().filter(msg => msg.room === room);
        socket.emit("load-history", history);
    });

    socket.on("message", (data) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = {
            room: data.room,
            name: data.name,
            text: data.text,
            time: time
        };

        // Сохраняем в файл
        saveMessageToHistory(messageData);

        // Рассылаем всем в комнате
        io.to(data.room).emit("message", messageData);
    });

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