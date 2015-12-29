// app.js
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var online = 0 ;
var numUsers = 0;

var allClients = [];



//#app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(4200);

io.on('connection',function(socket) {
  var addedUser = false;

  allClients.push(socket)

  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    io.sockets.emit('order_changed', allClients[0].username );

  });

  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }

    // Remove the entry from within the general queue:
    // Select the proper socket
    connected = false;
    while (connected == false)
    if (allClients[0].connected) {
      //noop
      connected = true;
    }
    else {
      allClients.shift();
      io.sockets.emit('order_changed', allClients[0].username );
    }
  });

  socket.on('make_selection',function(data) {
    user = data;
    console.log("User " + user + " clicked NEXT");
    //I can only click next if I am in charge.
    allClients.push(allClients[0]);
    allClients.shift();
    io.sockets.emit('order_changed', allClients[0].username );
  });
});
