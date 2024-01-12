const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const PRIVATE_FOLDER = path.join(__dirname, 'private');
const USER_DETAILS_FILE = path.join(PRIVATE_FOLDER, 'userDetails.txt');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Load user details from the file
let userDatabase = loadUserDatabase();

// Login route
app.post('/login', (req, res) => {
  const { name, birthdate, password } = req.body;

  // Check if user already exists
  if (userExists(name, birthdate, password)) {
    res.status(200).send('Login successful');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Save user details to the file
function saveUserDetails(name, birthdate, password) {
  const userDetails = `${name},${birthdate},${password}\n`;
  fs.appendFileSync(USER_DETAILS_FILE, userDetails);
}

// Load user database from the file
function loadUserDatabase() {
  if (!fs.existsSync(PRIVATE_FOLDER)) {
    fs.mkdirSync(PRIVATE_FOLDER);
  }

  if (!fs.existsSync(USER_DETAILS_FILE)) {
    fs.writeFileSync(USER_DETAILS_FILE, ''); // Create the file if it doesn't exist
  }

  const data = fs.readFileSync(USER_DETAILS_FILE, 'utf-8');
  const lines = data.split('\n').filter(Boolean);

  return lines.map(line => {
    const [name, birthdate, password] = line.split(',');
    return { name, birthdate, password };
  });
}

// Check if user exists and validate the password
function userExists(name, birthdate, password) {
  const existingUser = userDatabase.find(user => user.name === name && user.birthdate === birthdate && user.password === password);

  if (!existingUser) {
    // Save user details if not already saved
    saveUserDetails(name, birthdate, password);
    userDatabase = loadUserDatabase(); // Reload user database
  }

  return true; // Allow login for simplicity, you may implement more sophisticated checks
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
