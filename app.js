const socket = io();

let name = "";
let room = "";
let typingTimeout = null;

window.addEventListener("DOMContentLoaded", () => {
    const savedName = localStorage.getItem("chat_username");
    if (savedName) {
        document.getElementById("name").value = savedName;
    }
});

function joinChat() {
    name = document.getElementById("name").value.trim();
    room = document.getElementById("room").value.trim();

    if (!name || !room) {
        alert("Заполни имя и название комнаты!");
        return;
    }

    localStorage.setItem("chat_username", name);

    socket.emit("join-room", room);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "flex";
    document.getElementById("roomName").textContent = "Комната: " + room;
}

function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById("message");
    const text = input.value.trim();

    if (!text) return;

    // Сразу сбрасываем статус печати при отправке
    clearTimeout(typingTimeout);
    socket.emit("stop-typing", { room: room });

    socket.emit("message", {
        name: name,
        text: text,
        room: room
    });

    input.value = "";
}

// Отслеживание набора текста
function handleTyping() {
    socket.emit("typing", { room: room, name: name });

    clearTimeout(typingTimeout);
    
    // Если пользователь перестает печатать на 1.5 секунды, отправляем сигнал остановки
    typingTimeout = setTimeout(() => {
        socket.emit("stop-typing", { room: room });
    }, 1500);
}

socket.on("load-history", (history) => {
    const messages = document.getElementById("messages");
    messages.innerHTML = "";

    history.forEach((data) => {
        appendMessage(data);
    });
});

socket.on("message", (data) => {
    appendMessage(data);
});

// Слушаем события печати от других
socket.on("typing", (typingName) => {
    const indicator = document.getElementById("typingIndicator");
    const typingText = document.getElementById("typingText");
    
    typingText.textContent = `${typingName} печатает...`;
    indicator.style.display = "flex";
});

socket.on("stop-typing", () => {
    const indicator = document.getElementById("typingIndicator");
    indicator.style.display = "none";
});

function appendMessage(data) {
    const messages = document.getElementById("messages");
    const div = document.createElement("div");

    div.className = "message";
    if (data.name === name) {
        div.classList.add("own");
    }

    div.innerHTML = `
        <div class="message-header">
            <strong>${escapeHtml(data.name)}</strong>
            <span>${data.time || ""}</span>
        </div>
        <div class="message-text">${escapeHtml(data.text)}</div>
    `;

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}