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

var mapCache = [];

var allClients = [];

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/reset', function(req, res,next) {
    mapCache = [];
    allClients = [];
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

    console.log("Users online: "+numUsers + " " + socket.username + " joined from " + socket.request.connection.remoteAddress)

    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    socket.emit('update cache', mapCache);

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
      console.log("Users online: "+numUsers + " " + socket.username + " left!")
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
      console.log("No clients connected! (Clearing cache)")
      // Empty cache
      mapCache = []
    }
  });

  socket.on('make_selection',function(data) {

    console.log("User " + data.uuid + " clicked:" + data.map);

    connected = false;

    while (connected == false){
      // This request can only come from client in charge
      // Move it to the back of the queue
      allClients.push(allClients[0]);
      allClients.shift();

      //verify that next client is still connected
      if (allClients[0].connected)  {
        connected = true;
      }
      else {
        console.log("User: " + allClients[0].username + "is no longer connected");
        //delete first element then
        allClients.unshift();
      }
    }

    io.sockets.emit('order_changed', allClients[0].username );
    console.log("waiting for user: "+ allClients[0].username )
    io.sockets.emit('map_selected', data.map)

    mapCache.push(data.map);
  });

  socket.on('name change',function(data){
    socket.name = data
    console.log("Name changed to: " + data );
  });
});
