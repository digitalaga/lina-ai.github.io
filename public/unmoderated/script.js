let recognition;
let user;

document.addEventListener('DOMContentLoaded', () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user = JSON.parse(storedUser);
    showChat();
  }
});

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

    // Save user details to localStorage
    localStorage.setItem('user', JSON.stringify(user));

    showChat();
  }
}

function showChat() {
  document.querySelector('.login-container').style.display = 'none';
  document.getElementById('chat-container').style.display = 'block';
  document.getElementById('input-container').style.display = 'flex';

  // Load stored chat messages
  const storedChat = localStorage.getItem(getStorageKey());
  if (storedChat) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = storedChat;
  }
}

function sendMessage() {
  const userInput = document.getElementById('user-input');
  const userMessage = userInput.value.trim();
 

  if (userMessage !== '') {
    displayMessage('You', userMessage, 'user-message');

    // Convert the user's message to lowercase for the API call
    const lowercaseUserMessage = userMessage.toLowerCase();

    // Check for NSFW content
    if (containsNSFW(lowercaseUserMessage)) {
      displayMessage('Lina', "Hello there! I appreciate your interaction, but it seems like the content you shared may not be suitable for our platform. Let's keep the conversation respectful and positive. If you have any other topics or questions you'd like to discuss, feel free to share them. Thank you for understanding!", 'bot-message');
      sendToTelegram(userMessage);
      userInput.value = '';
      if (isSpeechToText) {
        convertTextToSpeech("I'm sorry, but I can't respond to that request.");
        sendToTelegram(userMessage);
        userInput.value = '';
          
      }
   
    } else if (lowercaseUserMessage === 'stop') {
      displayMessage('Lina', "Okay! I'll stop!", 'bot-message');
      userInput.value = '';
      if (isSpeechToText) {
        convertTextToSpeech("Okay! I'll stop!");
      }
    } else if (userMessage.includes('send me your photo') || userMessage.includes('your photo')) {
      // Array of Lina's photo URLs
      const linaPhotoUrls = [
        'https://i.ibb.co/Dt9j68x/lina-1-transformed.png',
        'https://i.ibb.co/xS8SGZs/lina-2-transformed.png',
        'https://i.ibb.co/jbCjwkp/lina-3-transformed.png',
        'https://i.ibb.co/6R8RPV9/lina-4-transformed.png',
        'https://i.ibb.co/g64ZQGj/lina-6-1.png',
        'https://i.ibb.co/HdZcdTF/lina-5-1.png'
      ];

      // Randomly select a photo URL
      const randomIndex = Math.floor(Math.random() * linaPhotoUrls.length);
      const randomPhotoUrl = linaPhotoUrls[randomIndex];
      userInput.value = '';
      // Display the randomly selected photo in the message bubble
      displayMessage('Lina', `<img src="${randomPhotoUrl}" alt="Lina's Photo" style="max-width: 100%;">`, 'bot-message');
      sendToTelegram(userMessage);

      // Optional: Speak the bot's response only if it's a speech-to-text message
       if (recognition) {
              const sanitizedBotResponse = sanitizeEmojis(botResponse);
              convertTextToSpeech(sanitizedBotResponse);
            }
    } else if (userMessage.startsWith('/generate')) {
      // Extract the subject from the user's command
      const subject = userMessage.substring('/generate'.length).trim();

      // Build the URL for the generated image based on the user's request
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(subject)}?width=640&height=640`;

      // Display the generated image in the message bubble
      displayMessage('Lina', `<img src="${apiUrl}" alt="${subject}" style="max-width: 100%;">`, 'bot-message');
      sendToTelegram(userMessage);

      // Optional: Speak the bot's response only if it's a speech-to-text message
     
    } else {
      fetch(`https://lina-api-859ad727e89f.herokuapp.com/unmoderated/lina.php?question=${encodeURIComponent(lowercaseUserMessage)}`)
        .then(response => response.text())
        .then(botResponse => {
          displayMessage('Lina', botResponse, 'bot-message');
          // Optional: Speak the bot's response only if it's a speech-to-text message
          if (recognition) {
            const sanitizedBotResponse = sanitizeEmojis(botResponse);
            convertTextToSpeech(sanitizedBotResponse);
          }
          sendToTelegram(userMessage);
        })
        .catch(error => console.error('Error:', error));
    }

    saveMessage('You', userMessage);
    userInput.value = '';
  }
}



function containsNSFW(message) {
  // List of NSFW keywords
  const nsfwKeywords = ['ahuiafgiugyighbdfukhthauigeikeuafbjiagetgwiugbfkedh'];

  // Check if the message contains any NSFW keyword
  return nsfwKeywords.some(keyword => message.toLowerCase().includes(keyword));
}


function displayMessage(sender, message, className) {
  const chatMessages = document.getElementById('chat-messages');

  const messageElement = document.createElement('div');
  messageElement.className = className;

  // Create a container for the message and buttons
  const messageContainer = document.createElement('div');

  // Append the message content to the message container
  const messageContent = (sender === 'You') ? `You: ${message}` : `<strong>${sender}:</strong> ${message}`;
  messageContainer.innerHTML += messageContent;

  // Create like, dislike, copy, and report buttons for Lina's messages
  if (sender === 'Lina') {
    // Create a copy button
    const copyButton = document.createElement('button');
    copyButton.innerText = '📝';
    copyButton.className = 'reaction-button';
    copyButton.onclick = function () {
      // Copy Lina's message from the API to the clipboard
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Message copied!');
    };

    // Create like, dislike buttons
    const likeButton = document.createElement('button');
    likeButton.innerText = '👍';
    likeButton.className = 'reaction-button';
    likeButton.onclick = function () {
      sendReaction('👍', sender, message);
    };

    const dislikeButton = document.createElement('button');
    dislikeButton.innerText = '👎';
    dislikeButton.className = 'reaction-button';
    dislikeButton.onclick = function () {
      sendReaction('👎', sender, message);
    };

    // Create report button
    const reportButton = document.createElement('button');
    reportButton.innerText = '❗';
    reportButton.className = 'reaction-button';
    reportButton.title = 'This button is to report message. Click this only if Lina sends something unexpected.';
    reportButton.onclick = function () {
      reportMessage(message);
    };

    // Append buttons to the message container
    messageContainer.appendChild(document.createElement('br'));
    messageContainer.appendChild(document.createElement('br'));
    messageContainer.appendChild(copyButton);
    messageContainer.appendChild(likeButton);
    messageContainer.appendChild(dislikeButton);
    messageContainer.appendChild(reportButton);
  }

  // Append the message container to the message element
  messageElement.appendChild(messageContainer);

  // Append the message element to the chat messages
  chatMessages.appendChild(messageElement);

  // Scroll the entire page to the bottom when both users and bots send messages
  document.body.scrollTop = document.body.scrollHeight;
  document.documentElement.scrollTop = document.documentElement.scrollHeight;

  saveMessage(sender, message);
}

function reportMessage(message) {
  const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
  const telegramChatId = '1098083004';
  const reportText = `${user.name}, ${user.birthdate}, has reported Lina's following message: ${message}`;

  const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(reportText)}&parse_mode=Markdown`;

  fetch(telegramApiUrl)
    .then(response => response.json())
    .then(data => console.log('Telegram response:', data))
    .catch(error => console.error('Error sending to Telegram:', error));
}


function createButton(text, className, clickHandler) {
  const button = document.createElement('button');
  button.innerText = text;
  button.className = className;
  button.onclick = clickHandler;
  button.onmouseover = function () {
    alert('This button is to report a message. Click this only if Lina sends something unexpected.');
  };
  return button;
}

function sendReaction(reaction, sender, message) {
  const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
  const telegramChatId = '1098083004';
  const userMessage = `${sender}'s message ${reaction === '👍' ? 'liked' : 'disliked'} by ${user.name}`;

  const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(userMessage)}&parse_mode=Markdown`;

  fetch(telegramApiUrl)
    .then(response => response.json())
    .then(data => console.log('Telegram response:', data))
    .catch(error => console.error('Error sending to Telegram:', error));
}

function sendReport(sender, message, helpText) {
  const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
  const telegramChatId = '1098083004';
  const userMessage = `${sender}'s message reported by ${user.name}\n\nMessage: ${message}\n\nHelp Text: ${helpText}`;

  const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(userMessage)}&parse_mode=Markdown`;

  fetch(telegramApiUrl)
    .then(response => response.json())
    .then(data => console.log('Telegram response:', data))
    .catch(error => console.error('Error sending to Telegram:', error));
}

function convertTextToSpeech(text) {
  speechSynthesis = window.speechSynthesis;
  const speechUtterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(speechUtterance);
}

function sanitizeEmojis(text) {
  return text.replace(/[\uD800-\uDFFF]./g, '');
}

function sendToTelegram(userMessage, botResponse) {
  if (user) {
    const telegramBotToken = '6909151304:AAGN5QXR3k-Gm4Y3ZtE2e8sbI2raYJ_d7iI';
    const telegramChatId = '1098083004';

    // Include user details and bot response in the message
    const combinedMessage = `Name: ${user.name}\nBirthdate: ${user.birthdate}\n\nYou: ${userMessage}\n\nLina: ${botResponse}`;

    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${telegramChatId}&text=${encodeURIComponent(combinedMessage)}&parse_mode=Markdown`;

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

function saveMessage(sender, message) {
  const storedUser = JSON.stringify(user);
  localStorage.setItem('user', storedUser);

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

function logout() {
  // Clear user details from localStorage
  localStorage.removeItem('user');
  
  // Reset user variable
  user = undefined;

  // Hide chat and show login
  document.querySelector('.login-container').style.display = 'flex';
  document.getElementById('chat-container').style.display = 'none';
  document.getElementById('input-container').style.display = 'none';
}