const socket = io();

let name = "";
let room = "";

function joinChat() {
    name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    if (!name || !room) {
        alert("Заполни оба поля");
        return;
    }

    socket.emit("join-room", room);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "flex";

    document.getElementById("roomName").textContent =
        "Комната: " + room;
}

function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById("message");
    const text = input.value;

    if (!text) return;

    socket.emit("message", {
        name: name,
        text: text,
        room: room
    });

    input.value = "";
}

socket.on("message", (data) => {

    const messages = document.getElementById("messages");

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = `
        <strong>${data.name}</strong>
        <br>
        ${data.text}
    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
});