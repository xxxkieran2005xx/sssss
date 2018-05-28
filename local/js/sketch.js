let socket;

let ships = [];
let this_Ship = {
  x: 0,
  y: 0,
  heading: 0,
  size: 0,
  health: 0,
  usrname: "",
  score: 0
}

let dust = [];
let dustData = [];
let weapon = [];

let leaderboard = [];
let messageboard = [];

let scr = 0;

let alert = {
  message: 'test2',
  duration: 1
};

const TEXT_SIZE = 18;

let zoom = 1;
let timer = "NaN:NaN";

let usrInput;
let username = " ";

let _canPlay = true;

let skinImg = [];
let sprites = []

let isHelpShowed = false

let isSkinChangerOpened = false;

let isSpritesLoaded = false;


//Nowe
let ui = {
  Title: 'Cosmic.IO - Lobby',
  Lobby: true,
  Time: 999,
  Alert: { message: 'test2', duration: 1 }
}

let movement = { Left: false, Right: false, Up: false, Down: false };

function preload() {
  for (let i = 0; i < 2; i++) {
    skinImg[i] = loadImage('./images/skins/skin' + i + '.png')
  }
}

function setup() {
  createCanvas(
    window.innerWidth,
    window.innerHeight
  );

  // Connection
  socket = io.connect('http://' + window.location.hostname + ':3000');

  //UI update
  socket.on('ui', (data) => {
    console.log("ui");
    console.log(data);
    ui = data;
    document.title = ui.Title;
    draw();
  });

  // Disconnect
  socket.on('disconnect', () => {
    window.location.reload();
  });

  // Alert
  socket.on('alert', (alertdata) => {
    alert = alertdata;
  })

  //Getting ships
  socket.on('ships', (data_ship) => {
    for (let i = 0; i < data_ship.length; i++) {
      if (data_ship[i].sockId == socket.id) {
        this_Ship = data_ship[i]
      }
      ships = data_ship
    }
  });

  socket.on('cosmicDust', (data) => {
    if (dust.length != data.length) {
      dust = [];
      for (let i = 0; i < data.length; i++) {
        dust[i] = new CosmicDust(data[i].size, data[i].x, data[i].y);
      }
    }
    dustData = data;
  });

  socket.on('dustRemove', (data) => {
    dust.splice(data, 1);
  });

  socket.on('messages', (data) => {
    messageboard = _.takeRight(data, 5);
  });

  usrInput = createInput();
}


function draw() {
  background(0)

  push();
  usrInput.position(width * 0.35, height / 2.3);
  usrInput.class('hub');
  pop();

  let delta = 1 / frameRate();
  // TIMER

  if (ui.Lobby) {
    // Lobby

    $('.hub').show();

    for (let i = 0; i < sprites.length; i++) {
      sprites[i].remove()
      isSpritesLoaded = false
    }

    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text('Preparing game\n' + ui.Time + ' seconds left', width / 2, 40);

    // Hello
    if (username != " " || username != "") {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text('Hello ' + username, 30, 30);
      pop();
    }

    push()
    fill(255)
    textAlign(CENTER)
    textSize(TEXT_SIZE)
    text("Press \".\" to change skin", width / 2, height - 10)
    if (isSkinChangerOpened) {
      for (let i = 0; i < skinImg.length; i++) {
        let index = i + 1;
        image(skinImg[i], width / 4 * index, height - 500)
        text("Press " + index, width / 3.5 * index, height - 400)
      }
    }
    pop()

    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 2);
    text('USERNAME', width / 2, height / 2.5);
    pop();

    push();
    fill(255);
    textAlign(CENTER);
    textSize(75);
    text("Cosmic.IO", width * 0.5, height * 0.265);
    pop();

  } else if (_canPlay) {
    // Game

    $('.hub').hide();

    push();

    // TIMER
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text(Math.floor(ui.Time) <= -1 ? 0 : Math.floor(ui.Time), width / 2, 40);

    // SCORE
    textAlign(LEFT);
    textSize(TEXT_SIZE);
    text('SCORE: ' + scr, 10, height - 10);

    // LEADERBOARD
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      textAlign(RIGHT);
      textSize(TEXT_SIZE);
      let index = 1 + i;
      text(index + ') ' + leaderboard[i].username + ' ' + leaderboard[i].score, width - 10, index * 20);
    }

    // MESSAGEBOARD
    for (let i = 0; i < messageboard.length; i++) {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(messageboard[i].message, 10, height / 2 + -i * 20);
    }

    push()
    textAlign(CENTER)
    textSize(TEXT_SIZE)
    text("Press \"H\" to show help", width / 2, height - 10)
    pop()

    if (isHelpShowed) {
      push()
      noFill()
      stroke(255)
      strokeWeight(4)
      rect(10, height / 3, 300, 160)
      pop()
      push()
      fill(255)
      textAlign(LEFT)
      text("W,A,S,D - Movement", 20, height / 3 + 25)
      text("E - Turn on/off engine", 20, height / 3 + 50)
      text("Shift - Boost", 20, height / 3 + 75)
      pop()
    }

    pop();

    translate(width / 2, height / 2);
    let newscale = 50 / this_Ship.size;
    zoom = lerp(zoom, newscale, 0.1);
    scale(zoom);
    translate(-this_Ship.x, -this_Ship.y);

    for (let i = weapon.length - 1; i >= 0; i--) {

      weapon[i].render();
      weapon[i].update();
      for (let j = ships.length - 1; j >= 0; j--) {
        if (socket.id === ships[j].id) {
          if (weapon[i].hit(ships[j], i)) {
            // HIT
          }
        }
      }
    }

    // Drawing players' ships
    for (let i = 0; i < ships.length; i++) {
      push();

      if (!isSpritesLoaded) {
        sprites = []
        for (let j = 0; j < ships.length; j++) {
          sprites[j] = createSprite(0, 0)
        }
        isSpritesLoaded = true;
      }

      
      sprites[i].position.x = ships[i].x
      sprites[i].position.y = ships[i].y
      sprites[i].rotation = degrees(ships[i].heading)

      sprites[i].addImage(skinImg[ships[i].skinId == null ? 0 : ships[i].skinId])
    
      pop()
      push();
      
      fill(0, 255, 0);
      textAlign(CENTER);
      textSize(TEXT_SIZE);
      text(ships[i].username + '\n <3: ' + ships[i].health, ships[i].x, ships[i].y + 150);
      pop()
      
    }
    drawSprites();

    for (let i = dust.length - 1; i >= 0; i--) {
      dust[i].render();
    }
    ui.Time -= delta;
  } else {
    // Spectator
    $('.hub').hide();

    push();
    // TIMER
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text('You are spectator\n' + timer, width / 2, 40);

    // LEADERBOARD
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      textAlign(RIGHT);
      textSize(TEXT_SIZE);
      let index = 1 + i;
      text(index + ') ' + leaderboard[i].username + ' ' + leaderboard[i].score, width - 10, index * 20);
    }

    // MESSAGEBOARD
    for (let i = 0; i < messageboard.length; i++) {
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(messageboard[i].message, 10, height / 2 + -i * 20);
    }
    pop();

    // Rendering player's ships
    for (let i = ships.length - 1; i >= 0; i--) {
      // TODO <-- this
    }

    //Alert
    if (ui.alert.duration > 0) {
      push();
      fill(255);
      textAlign(LEFT);
      textSize(TEXT_SIZE);
      text(ui.alert.message, width * 0.5, height * 0.8);
      pop();
      ui.alert.duration -= delta;
    }

  }
}

function keyPressed() {
  if (keyCode == RIGHT_ARROW || keyCode == 68) {
    movement.right = true;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    movement.left = true;
  } else if (keyCode == UP_ARROW || keyCode == 87) {
    movement.up = true;
  } else if (keyCode == 69) {
    // On Press 'E'
    //TODO <-- engines
  } else if (keyCode == 16) {
    // On Press 'Shift'
    //TODO <-- boost
  } else if (keyCode == 32) {
    // On Press 'Space'
    if (_canPlay) {
      //TODO <-- weapon

      // let weaponData = {
      //   x: ship.pos.x,
      //   y: ship.pos.y,
      //   heading: ship.heading
      // }
      // socket.emit('weapon', weaponData);
    }
  } else if (keyCode == 13) {
    // On Press 'Enter'
    if (usrInput.value().length < 18) {
      username = usrInput.value();
    } else if (usrInput.value().length >= 18) {
      username = "Too long bruh";
    }

    socket.emit('username', username);
  } else if (keyCode == 72) {
    // Help
    isHelpShowed = isHelpShowed == true ? false : true
  } else if (keyCode == 190) {
    // Skin Changer
    if (ui.lobby) {
      isSkinChangerOpened = isSkinChangerOpened == true ? false : true
    }
  } else if (keyCode == 49) {
    // Skin Changer - select 1 skin
    if (isSkinChangerOpened) {
      socket.emit("skin", 0)
      isSkinChangerOpened = false
    }
  } else if (keyCode == 50) {
    // Skin Changer - select 2 skin
    if (isSkinChangerOpened) {
      socket.emit("skin", 1)
      isSkinChangerOpened = false
    }
  }
  socket.emit('movement', movement);
}

function keyReleased() {
  if (keyCode == UP_ARROW || keyCode == 87) {
    movement.up = false;
  } else if (keyCode == RIGHT_ARROW || keyCode == 68) {
    movement.right = false;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    movement.left = false;
  } else if (keyCode == 16) {
    // On Release 'Shift'
  } else if (keyCode == 32) {
    // On Release 'Space'
  }
  socket.emit('movement', movement);
}