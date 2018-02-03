// https://socket.io/get-started/chat/
//var app = require('express')();
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.get(`/`, (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var EditorSocketIOServer = require('ot/lib/editor-socketio-server');
var server = new EditorSocketIOServer("", [], 1);


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  server.addClient(socket);
});



http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});