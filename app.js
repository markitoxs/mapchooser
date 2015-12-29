// app.js
var app = require('express')();
var express = require('express');
app.use(express.static('public'));

//
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(4200, function(){
  console.log('listening on *:4200');
});




var online = 0 ;
var numUsers = 0;

//holds up whatever maps are already selected

var mapCache = {}

var allClients = [];

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});


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
    try {
      if (allClients[0].connected) {
        //noop
        connected = true;
      }
      else {
        allClients.shift();
        try {
          io.sockets.emit('order_changed', allClients[0].username );
        }
        catch(err) {
          console.log("Error happened: "+err.message)
        }
      }
    } catch(err) {
      connected = true
      console.log("No clients connected!")
    }

  });

  socket.on('make_selection',function(data) {

    console.log("User " + data.uuid + " clicked:" + data.map);

    //I can only click next if I am in charge.
    allClients.push(allClients[0]);
    allClients.shift();
    io.sockets.emit('order_changed', allClients[0].username );
    io.sockets.emit('map_selected', data.map)
    mapCache[data.map] =  true;
  });
});
