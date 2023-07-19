// index.js
const express = require('express');
const app = express();
const port = 3000; // Change this to the desired port number
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // For password hashing

// Middleware to parse incoming JSON data
app.use(express.json());

// Middleware to handle URL-encoded data
app.use(express.urlencoded({ extended: true }));

// MongoDB connection URI
const mongoURI = 'YOUR_MONGODB_URI';

// MongoDB client instance
let db;

// Connect to the MongoDB database
MongoClient.connect(mongoURI, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(); // Get the database instance
    console.log('Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });


  // API endpoint to create a new user
app.post('/users', (req, res) => {
  const newUser = req.body; // Assuming the request contains user data in JSON format

  db.collection('users')
    .insertOne(newUser)
    .then((result) => {
      res.json(result.ops[0]); // Return the newly created user
    })
    .catch((err) => {
      console.error('Error creating user:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// API endpoint to update an existing user
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const updatedUser = req.body; // Assuming the request contains updated user data in JSON format

  db.collection('users')
    .updateOne({ _id: ObjectId(userId) }, { $set: updatedUser })
    .then((result) => {
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    })
    .catch((err) => {
      console.error('Error updating user:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// API endpoint to delete an existing user
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  db.collection('users')
    .deleteOne({ _id: ObjectId(userId) })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    })
    .catch((err) => {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});


// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});


// Secret key for JWT
const secretKey = 'your_secret_key'; // Replace with your own secret key
// API endpoint for user login
app.post('/login', (req, res) => {
  const { username, password } = req.body; // Assuming the request contains username and password in JSON format

  // Check if the user exists in the database
  db.collection('users')
    .findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Validate the user's password
      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If the password is correct, generate a JWT token
        const payload = { id: user._id, username: user.username };
        const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

        // Send the token as a response
        res.json({ token });
      });
    })
    .catch((err) => {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
