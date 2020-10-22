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

        case 'init':
          // Add new user to the list
          users[message['init'][0]] = [message['init'][0], message['init'][1], message['init'][2]];
          console.log(message['init'][0]+ ' from web : ' + message['init'][2]);
          // Add new connection to the list
          connections[message['init'][0]] = [message['init'][0], connection]
          // 'init' - Broadcast new user to others
          for(let i in connections) { connections[i][1].sendUTF(stringify(message)); }
          // 'loadOthers' - Load all users to the new user
          connections[message['init'][0]][1].sendUTF(stringify({'loadOthers': users}));
          break;

        case 'move':
          console.log(message['move']['username'], message['move']['coords']);
          users[message['move']['username']][2] = message['move']['coords'];
          for(let i in connections) { connections[i][1].sendUTF(stringify(message)); }
          console.log(message['move']['username'] + ' from users : ' + users[message['move']['username']][2]);
          break;

        case 'offline':
          console.log('User '+message['offline']+' left');
          delete users[message['offline']];
          for(let i in connections) { connections[i][1].sendUTF(stringify(message)); }
          console.log(Object.keys(users));
          break;

      }

    } else if (message.type === 'binary') {
    }
  }

  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });



});
