const address = 'ws://127.0.0.1:8080';
const protocol = 'echo-protocol';
const socket = new WebSocket(address, protocol);
const stringify = (e) => { return JSON.stringify(e) }
const parse = (e) => { return JSON.parse(e) }
const random = (e) => { return Math.round(Math.random()*e) }
const generateColor = () => { return 'rgba(' +random(255)+ ',' +random(255)+ ',' +random(255)+ ')' }

let username = '';
let userid = '';
let offsetX = 0;
let offsetY = 0;
let mouseX = 0;
let mouseY = 0;
let myBall = undefined;
const wall = document.getElementById('wall');
const changeUsername_field = document.getElementById('changeUsername_field');
const blank = document.getElementById('blank');

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
      if (i != userid) {
        createBall(i, others[i]['color'], others[i]['size'], others[i]['coords']);
        addUser(others[i]['username'], i, others[i]['color']);
      }
  }
}

function generateUser() {
  let userid = 'u' + (new Date()).getTime().toString().substr(10) + (new Date()).getMilliseconds().toString();
  // Generate random username
  const usernames = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William',
                    'Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah',
                    'Charles','Karen','Daniel','Lisa','Mark','Emily','Andrew','Donna','Kevin','Carol',
                    'Joshua','Melissa','Timothy','Amy','Gary','Angela','Larry','Nicole','Frank','Ruth'];

  const title = document.getElementsByTagName('title');
  if(getCookie()['circles'] != undefined) {
    username = getCookie()['circles'];
  }
  else {
    username = usernames[random(usernames.length-1)];
    //setCookie(username);
  }

  title[0].innerText = 'Circles - ' + username;
  return [username, userid];
}

function setCookie(username) {
  let later = new Date().getTime() * 2;
  document.cookie = 'circles='+username+';expires=' +(new Date(later)).toUTCString();
  console.log('Set Cookie for '+username);
}

function getCookie() {
  return Object.fromEntries(document.cookie.split(';').map((e)=>e.trim().split('=')));
}

// Add username to the menu
function addUser(username, userid, color) {
  let div = document.createElement('div');
  div.classList.add('user');
  div.id = userid + '_menu';
  div.innerHTML = '<div class="userBall" style="background-color: '+color+'"></div><div class="userName">'+username+'</div>';
  let usersDiv = document.getElementById('users');
  usersDiv.appendChild(div);
}

// Remove username and a ball
function removeUser(userid) {
  document.getElementById(userid+'_menu').remove();
  document.getElementById(userid).remove();
}

// Get current ball coordinates
function getCoords(userid) {
  let e = document.getElementById(userid);
  let x = e.offsetLeft;
  let y = e.offsetTop;
  return [y, x];
}

function getSize(userid) {
  let e = document.getElementById(userid);
  let width = e.offsetWidth;
  return width;
}

// Create personal ball
function createMyBall(userid) {
  myBall = document.createElement('div');
  myBall.id = userid;
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
function createBall(userid, color, size, coords) {
  let div = document.createElement('div');
  div.id = userid;
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
  let message = {'move': {'userid': userid, 'coords': [myBall.offsetTop, myBall.offsetLeft]}}
  socket.send(stringify(message));
}

// Move ball via touchscreen
function dragMobile(e) {
  mouseX = e.touches[0].clientX;
  mouseY = e.touches[0].clientY;
  myBall.style.top = (mouseY - offsetY) + "px";
  myBall.style.left = (mouseX - offsetX) + "px";
  ballOffsetMobile(e);
  let message = {'move': {'userid': userid, 'coords': [myBall.offsetTop, myBall.offsetLeft]}}
  socket.send(stringify(message));
}

// Connection opened
socket.addEventListener('open', function (event) {

  // Generate random username
  [username, userid] = generateUser();
  // Create personal ball
  createMyBall(userid);

  let coords = getCoords(userid);
  let color = getComputedStyle(myBall)['backgroundColor'];
  let size = getSize(userid);

  let message = {'init': {'username': username, 'userid': userid, 'color': color, 'size': size, 'coords': coords}};
  addUser(username, userid, color);
  let me = document.getElementById(userid+'_menu');
  me.classList.add('me');
  socket.send(stringify(message));
  changeUsername_field.value = username;

  me.addEventListener('click', () => {
    changeUsername_field.style.visibility = 'visible';
    changeUsername_field.focus();
    blank.style.visibility = 'visible';
  });

  function changeUsername() {
    setCookie(changeUsername_field.value);
    changeUsername_field.style.visibility = 'hidden';
    blank.style.visibility = 'hidden';
    socket.send(stringify({'changeUsername': {'userid': userid, 'username': changeUsername_field.value}}));
  }

  changeUsername_field.addEventListener('keypress', (event) => {
      if(event.keyCode === 13 || event.key === 'Enter' ) {
        changeUsername();
      }
    });

  blank.addEventListener('click', (e) => {
    changeUsername();
  });

  myBall.addEventListener('mousedown', (e) => {
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
        if (message['init']['userid'] != userid) {
          console.log(message['init']['username']+' joined');
          addUser(message['init']['username'], message['init']['userid'], message['init']['color']);
          createBall(message['init']['userid'], message['init']['color'], message['init']['size'], message['init']['coords']);
        }
        break;

      case 'move':
        if(message['move']['userid'] != userid) {
          let ball = document.getElementById(message['move']['userid']);
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

      case 'changeUsername':
        let uid = document.getElementById(message['changeUsername']['userid']+'_menu');
        uid.lastElementChild.innerText = message['changeUsername']['username'];
        break;


      case 'offline':
        console.log(message['offline']+' left');
        removeUser(message['offline']);
        break;
    }
});
