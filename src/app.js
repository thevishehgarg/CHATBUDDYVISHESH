require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const Register = require('./models/registers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const auth = require('../src/middleware/auth');

require('./db/conn');

const static_path = path.join(__dirname, '../public');

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));

app.get('https://chatbuddyp.herokuapp.com/', (req, res) => {
  res.render('index');
});
app.get('https://chatbuddyp.herokuapp.com//home', auth, (req, res) => {
  res.render('home');
});

app.post('https://chatbuddyp.herokuapp.com/', async (req, res) => {
  try {
    const password = req.body.Password;
    const Cpassword = req.body.ConfirmPassword;

    if (password === Cpassword) {
      const registerUser = new Register({
        Email: req.body.Email,
        Password: req.body.Password,
        ConfirmPassword: req.body.ConfirmPassword,
      });
      const token = await registerUser.generateToken();

      res.cookie('jwt', token, {
        expires: new Date(Date.now() + 3153600000),
        httpOnly: true,
      });

      const registered = await registerUser.save();
      res.status(201).render('index');
    } else {
      res.send('Passwords are not matching');
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('https://chatbuddyp.herokuapp.com/home', async (req, res) => {
  try {
    const email = req.body.LoginEmail;
    const password = req.body.LoginPassword;

    const useremail = await Register.findOne({ Email: email });
    const isMatch = await bcrypt.compare(password, useremail.Password);

    const token = await useremail.generateToken();

    res.cookie('jwt', token, {
      expires: new Date(Date.now() + 3153600000),
      httpOnly: true,
    });

    if (isMatch) {
      res.status(201).render('home');
    } else {
      res.send('invalid login details');
    }
  } catch (error) {
    res.status(400).send('invalid login details');
  }
});

// Node server which will handle socket io connections
const io = require('socket.io')("https://chatbuddyp.herokuapp.com/home")

const users = {};

io.on('connection', socket =>{
    // If any new user joins, let other users connected to the server know!
    socket.on('new-user-joined', name =>{ 
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });

    // If someone sends a message, broadcast it to other people
    socket.on('send', message =>{
        socket.broadcast.emit('receive', {message: message, name: users[socket.id]})
    });

    // If someone leaves the chat, let others know 
    socket.on('disconnect', message =>{
        socket.broadcast.emit('left', users[socket.id]);
        delete users[socket.id];
    });


})

app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
