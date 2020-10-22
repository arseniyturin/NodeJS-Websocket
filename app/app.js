let websocketserver = require('websocket').server;
let http = require('http');
let users = {};
let connections = {};
const port = 8080;
const stringify = (e) => { return JSON.stringify(e) };
const parse = (e) => { return JSON.parse(e) };

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
});

// Web Socket Instance
ws = new websocketserver({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  return true;
}

ws.on('request', function(request) {
  // Wrong Origin
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  // Connecting
  var connection = request.accept('echo-protocol', request.origin);

  connection.on('message', message);

  function message(incoming) {

    if (incoming.type === 'utf8') {

      let message = parse(incoming.utf8Data);
      switch(Object.keys(message)[0]) {

        // User connected
        case 'init':
          // Add new user to the list
          users[message['init']['username']] = { 'color': message['init']['color'], 'coords': message['init']['coords'] };
          // Add new connection to the list
          connections[message['init']['username']] = connection;
          // Broadcast new user to existing users
          for(let i in connections) { connections[i].sendUTF( stringify(message) ) }
          // Send existing users to the new user
          connections[message['init']['username']].sendUTF( stringify( {'loadOthers': users} ) );
          console.log('Users: '+ Object.keys(users));
          break;

        // User moved circle
        case 'move':
          // Add user coordinates
          users[message['move']['username']]['coords'] = message['move']['coords'];
          // Broadcast user coordinates to all users
          for(let i in connections) {
            connections[i].sendUTF(stringify(message));
          }

          break;

        // User disconnected
        case 'offline':
          delete users[message['offline']];
          for(let i in connections) { connections[i].sendUTF(stringify(message)); }
          console.log('Users: '+ Object.keys(users));
          break;

      }

    } /*else if (message.type === 'binary') {}*/
  }

  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' | User disconnected.');
  });



});
