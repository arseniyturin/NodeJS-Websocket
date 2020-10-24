const address = 'ws://127.0.0.1:8080';
const protocol = 'echo-protocol';
const socket = new WebSocket(address, protocol);
const stringify = (e) => { return JSON.stringify(e) }
const parse = (e) => { return JSON.parse(e) }
const random = (e) => { return Math.round(Math.random()*e) }
const generateColor = () => { return 'rgba(' +random(255)+ ',' +random(255)+ ',' +random(255)+ ')' }

let username = '';
let users = {};
let balls = {};
let offsetX = 0;
let offsetY = 0;
let mouseX = 0;
let mouseY = 0;
let myBall = undefined;
const wall = document.getElementById('wall');

const ballOffset = (e) => {
  offsetX = e.clientX - myBall.offsetLeft;
  offsetY = e.clientY - myBall.offsetTop;
}

const ballOffsetMobile = (e) => {
  offsetX = e.touches[0].clientX - myBall.offsetLeft;
  offsetY = e.touches[0].clientY - myBall.offsetTop;
}

function loadOthers(others) {
  for(let i in others) {
      if (i != username) {
        createBall(i, others[i]['color'], others[i]['size'], others[i]['coords']);
        addUser(i, others[i]['color']);
      }
  }
}

// Add username to the menu
function addUser(username, color) {
  let div = document.createElement('div');
  div.classList.add('user');
  div.id = username + '_menu';
  div.innerHTML = '<div class="userBall" style="background-color: '+color+'"></div><div class="userName">'+username+'</div>';
  let usersDiv = document.getElementById('users');
  usersDiv.appendChild(div);
}

// Remove username and a ball
function removeUser(username) {
  document.getElementById(username+'_menu').remove();
  document.getElementById(username).remove();
  delete this.users[username];
}

// Get current ball coordinates
function getCoords(id) {
  let e = document.getElementById(id);
  let x = e.offsetLeft;
  let y = e.offsetTop;
  return [y, x];
}

function getSize(id) {
  let e = document.getElementById(id);
  let width = e.offsetWidth;
  return width;
}

// Create personal ball
function createMyBall(id) {
  myBall = document.createElement('div');
  myBall.id = id;
  myBall.classList.add('ball');
  myBall.classList.add('movableBall');
  myBall.style.backgroundColor = generateColor();
  myBall.style.top = random(200)+'px';
  myBall.style.left = random(200)+'px';
  let size = (20+random(180))+'px';
  myBall.style.width = size;
  myBall.style.height = size;
  document.body.appendChild(myBall);
}

// Create users ball
function createBall(username, color, size, coords) {
  let div = document.createElement('div');
  div.id = username;
  div.classList.add('ball');
  div.style.width = size + 'px';
  div.style.height = size + 'px';
  div.style.backgroundColor = color;
  div.style.top = coords[0] + 'px';
  div.style.left = coords[1] + 'px';
  document.body.appendChild(div);
}

function sendMessage(message) {
	socket.send(stringify({'wall': message}));
}

// Move ball
function drag(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  myBall.style.top = (mouseY - offsetY) + "px";
  myBall.style.left = (mouseX - offsetX) + "px";
  ballOffset(e);
  let message = {'move': {'username': username, 'coords': [myBall.offsetTop, myBall.offsetLeft]}}
  socket.send(stringify(message));
}

// Move ball via touchscreen
function dragMobile(e) {
  mouseX = e.touches[0].clientX;
  mouseY = e.touches[0].clientY;
  myBall.style.top = (mouseY - offsetY) + "px";
  myBall.style.left = (mouseX - offsetX) + "px";
  ballOffsetMobile(e);
  let message = {'move': {'username': username, 'coords': [myBall.offsetTop, myBall.offsetLeft]}}
  socket.send(stringify(message));
}

// Connection opened
socket.addEventListener('open', function (event) {

  // Generate random username
  const usernames = ['Billy','Bobby','Mikey','Jimmy','Sean','Sandy','Peter','Jessie','Amanda','Particia','Lisa','Carol','Amy','Anna','Olivia','Megan','Noah','Lilly','Bryan','Alice','Doris','Wayne','Bradley','Louis','Alexis','Rose','Sophia'];
  username = usernames[random(usernames.length-1)] + '_' + random(10);
  const title = document.getElementsByTagName('title');
  title[0].innerText = 'Circles - ' + username;

  // Create personam ball
  createMyBall(username);
  let coords = getCoords(username);
  let color = getComputedStyle(myBall)['backgroundColor'];
  let size = getSize(username);
  let message = {'init': {'username': username, 'color': color, 'size': size, 'coords': coords}};
  addUser(username, color);
  let me = document.getElementById(username+'_menu');
  me.classList.add('me');
  socket.send(stringify(message));

  myBall.addEventListener('mousedown', () => {
    document.addEventListener('mousemove', drag);
    ballOffset(e);
  });

  myBall.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', drag);
  });

  // Mobile start drawing
  myBall.addEventListener('touchstart', function(e){
    e.preventDefault();
    ballOffsetMobile(e);
  });

  // Mobile drawing
  myBall.addEventListener('touchmove', function(e){
    e.preventDefault();
    dragMobile(e);
  });

});

// Listen for messages
socket.addEventListener('message', function (event) {

    // Parse Incoming Message
    let message = parse(event.data);

    // Decide what action to take
    switch(Object.keys(message)[0]) {

      case 'init':
        if (message['init']['username'] != username) {
          console.log(message['init']['username']+' joined');
          createBall(message['init']['username'], message['init']['color'], message['init']['size'], message['init']['coords']);
          addUser(message['init']['username'], message['init']['color']);
        }
        break;

      case 'move':
        if(message['move']['username'] != username) {
          let ball = document.getElementById(message['move']['username']);
          ball.style.top = message['move']['coords'][0] + 'px';
          ball.style.left = message['move']['coords'][1] + 'px';
        }
        break;

      case 'loadOthers':
        loadOthers(message['loadOthers']);
        break;


      case 'wall':
        wall.innerText = message['wall'];
        break;

      case 'offline':
        console.log(message['offline']+' left');
        removeUser(message['offline']);
        break;
    }
});

/*
window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  socket.send(stringify({'offline': username}));
  //removeUser(message['offline']);
});

window.addEventListener('unload', function(){
  socket.send(stringify({'offline': username}));
  removeUser(message['offline']);
});
*/
