let recognition;
let user;

function startSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition is not supported in your browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('user-input').value = transcript;
    recognition.stop();
    // Automatically send the voice message
    sendMessage();
  };

  recognition.onend = function () {
    recognition.stop();
  };

  recognition.start();
}

function login() {
  const nameInput = document.getElementById('name');
  const birthdateInput = document.getElementById('birthdate');

  const name = nameInput.value.trim();
  const birthdate = birthdateInput.value.trim();

  if (name !== '' && birthdate !== '') {
    user = { name, birthdate };

    document.querySelector('.login-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    document.getElementById('input-container').style.display = 'flex';

    const storedChat = localStorage.getItem(getStorageKey());
    if (storedChat) {
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = storedChat;
    }
  }
}

function sendMessage() {
  const userInput = document.getElementById('user-input');
  const userMessage = userInput.value.trim().toLowerCase();

  if (userMessage !== '') {
    displayMessage('You', userMessage, 'user-message');

    if (userMessage === 'stop') {
      displayMessage('Lina', "Okay! I'll stop!", 'bot-message');
    } else {
      fetch(`https://digitalaga.000webhostapp.com/chatgpt/lina.php?question=${encodeURIComponent(userMessage)}`)
        .then(response => response.text())
        .then(botResponse => {
          displayMessage('Lina', botResponse, 'bot-message');
          if (recognition) {
            const sanitizedBotResponse = sanitizeEmojis(botResponse);
            convertTextToSpeech(sanitizedBotResponse);
          }
          sendToTelegram(userMessage);
        })
        .catch(error => console.error('Error:', error));
    }

    saveChat();
    userInput.value = '';
  }
}

function displayMessage(sender, message, className) {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
  const messageElement = document.createElement('div');
  messageElement.className = className;
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function convertTextToSpeech(text) {
  speechSynthesis = window.speechSynthesis;
  const speechUtterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(speechUtterance);
}

function sanitizeEmojis(text) {
  return text.replace(/[\uD800-\uDFFF]./g, '');
}

function sendToTelegram(message) {
  if (user) {
    const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
    const telegramChatId = '1098083004';

    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;

    fetch(telegramApiUrl)
      .then(response => response.json())
      .then(data => console.log('Telegram response:', data))
      .catch(error => console.error('Error sending to Telegram:', error));
  }
}

function saveChat() {
  const chatMessages = document.getElementById('chat-messages').innerHTML;
  localStorage.setItem(getStorageKey(), chatMessages);
}

function getStorageKey() {
  return `chat_${user.name}_${user.birthdate}`;
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function clearChat() {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  localStorage.removeItem(getStorageKey());
}
