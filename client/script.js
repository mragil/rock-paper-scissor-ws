const nameInput = document.getElementById('name-input');
const roomInput = document.getElementById('room-input')
const connectBtn = document.getElementById('connect-btn');
const nameGreeting = document.getElementById('name-greeting');
const chatList = document.getElementById('chat-list');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-btn');
const connectSection = document.getElementById('connect-section');
// Rock Paper Scissor
const rockBtn = document.getElementById('rock-btn')
const paperBtn = document.getElementById('paper-btn')
const scissorBtn = document.getElementById('scissor-btn')

let id;
connectBtn.addEventListener('click', () => {
    const socket = new WebSocket(`ws://localhost:3000/chat?userName=${nameInput.value}&roomName=${roomInput.value}`);

    socket.onopen = function (event) {
        id = nameInput.value;
        nameGreeting.innerHTML = `Welcome ${nameInput.value} on Room : ${roomInput.value}`;
        nameInput.value = '';
        roomInput.value = '';
        connectSection.style.display = 'none';

        socket.addEventListener("message", event => {
            const message = JSON.parse(event.data);
            if(message.type === 'INFO') {
                message.text = ` INFO -> ${message.text}`
            }
            const chat = document.createElement("li");
            chat.appendChild(document.createTextNode(message.text));
            chatList.append(chat)
        });

        const sendMessage = (type,text) => {
            const msg = {
                type,
                text
            }
            socket.send(JSON.stringify(msg))
        }

        sendMessageBtn.addEventListener('click', () => {
            sendMessage('CHAT',messageInput.value)
            messageInput.value = '';
        })

        rockBtn.addEventListener('click', () => {
            sendMessage('GAME', 'Rock');
        })

        scissorBtn.addEventListener('click', () => {
            sendMessage('GAME', 'Scissor');
        })

        paperBtn.addEventListener('click', () => {
            sendMessage('GAME', 'Paper');
        })
    }

    socket.onerror = function (error) {
        nameGreeting.innerHTML = `Cannot Join Room ${roomInput.value} because limit is exceed! ${JSON.stringify(error)}`
        nameInput.value = '';
        roomInput.value = '';
    }
})

