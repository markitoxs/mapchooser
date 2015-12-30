// Code to be run clinet side

var total_maps = 15
var firstClient = 0 ;
var inCharge = false;
var mapCache = [];
var myName = "YOUR NAME";

//Initiate connection to server
var host = window.location.origin
var socket = io.connect(host);

// Create random uuid
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
  s4() + '-' + s4() + s4() + s4();
}

// function to grey out a specified div
function greyDiv(map) {
  selector = "#" + map
  $(selector).css('background-color', 'grey');
  $(selector).css('opacity', '0.4');
  $(selector).unbind();
}

// handle live edit ENTER and ESC keys
document.addEventListener('keydown', function (event) {
  var esc = event.which == 27,
  nl = event.which == 13,
  el = event.target,
  input = el.nodeName != 'INPUT' && el.nodeName != 'TEXTAREA',
  data = {};

  if (input) {
    if (esc) {
      // restore state
      document.execCommand('undo');
      el.blur();
    } else if (nl) {
      // save
      data[el.getAttribute('data-name')] = el.innerHTML;

      // Send the actual request
      if ( data.myname == myName ) {
          //do nothing
      } else {
        socket.emit('name change', data.myname);
      }

      el.blur();
      event.preventDefault();
    }
  }
}, true);

//Wipe name after clicking to change
$('#myname>p').click(
  function(){
    $(this).text('');
});


socket.on('connect', function(data) {
  uuid = guid();
  socket.emit('add user', uuid);
  $("#my_uuid").text(uuid);
});

socket.on('order_changed',function(data){
  console.log(data + ' gets to choose');

  if ( uuid == data ) {
    $('#rectangle').css('background-color', 'green');
    $('#rectangle>.status').text('YOUR TURN');
    inCharge = true;
  } else {
    $('#rectangle').css('background-color', 'red');
    $('#rectangle>.status').text('WAITING ON: ' + data);
    inCharge = false;
  }
  $("#position").text(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
  console.log(data.username  + ' joined');
});

socket.on('user left', function (data) {
  console.log(data.username + ' left');
});


socket.on('update cache', function (data) {
  mapCache = data;
  total_maps = total_maps - mapCache.length;
  jQuery.each(mapCache,function(i,val){ greyDiv(val)});
});

socket.on('map_selected', function (data) {
  console.log("Map "+ data + " was removed");
  greyDiv(data);
  mapCache.push(data)
  --total_maps;
  console.log ("maps left:"+total_maps)
  if ( total_maps == 1 ) { inCharge = false; }
});

// Define buttons
$('.map').each(function(index) {
  $(this).click(function() {
    if (inCharge && total_maps > 1) {
      //console.log("clicking on:"+$(this).attr('id'))
      socket.emit('make_selection', {uuid: $("#my_uuid").text(), map: $(this).attr('id')})
    }
    else {
      console.log ("Tried to click without inCharge");
    }

  });
});
