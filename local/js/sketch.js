let socket;

let ship;
let ships = [];
let dust = [];
let dustData = [];
let moon = [];
let weapon = [];


const RENDER_SIZE = 5;
const WEAPON_VELOCITY = 25;
const AMOUNT_OF_DUST = 1000;
const AMOUNT_OF_MOONS = 10;
const TEXT_SIZE = 18;

let zoom = 1;
let timer = "NaN:NaN";

let _hub = true;

let _debugger = false;

function setup() {
  createCanvas(
    window.innerWidth,
    window.innerHeight
  );

  ship = new Ship(60, 0, 0, RENDER_SIZE);

  // Connection
  socket = io.connect('http://'+window.location.hostname+':3000');

  socket.on('connect', function () {

  });

  socket.on('disconnect', function () {
    window.location.reload();
  });

  let shipData = {
    x: ship.pos.x,
    y: ship.pos.y,
    heading: ship.heading,
    size: ship.size,
    health: ship.health
  }

  socket.emit('start', shipData);

  socket.on('hjerteslag', (data) => {
    ships = data;
  });

  socket.on('cosmicdust', (data) => {
    if (dust.length != data.length) {
      dust = [];
      for (let i = 0; i < data.length; i++) {
        dust[i] = new CosmicDust(data[i].size, data[i].x, data[i].y);
      }
    }
    dustData = data;
  });

  socket.on('weaponData', (data) => {
    for (let i = data.length - 1; i >= 0; i--) {
        let pos = createVector(data[i].x, data[i].y);
        weapon.push(new Weapon(data[i].id, pos, data[i].heading, WEAPON_VELOCITY));
    }

  });

  socket.on('weaponDelete', (data) => {
    weapon.splice(data, 1);
  });

  socket.on('time', (data) => {
    timer = data.minutes + ":" + data.seconds;
  });

  socket.on('game', (data) => {
    document.title = data.title;
    _hub = data.hub;
  });
}

function draw() {
  background(0);
  
  if (_debugger) {
    console.log('SHIP: { x: ' + ship.pos.x + ' y: ' + ship.pos.y +" }");
  }

  // TIMER
  if (_hub) {
    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text('Preparing game\n' + timer, width / 2, 40);
    pop();
  } else {
    push();
    fill(255);
    textAlign(CENTER);
    textSize(TEXT_SIZE * 1.5);
    text(timer, width / 2, 40);
    pop();
  }

  translate(width / 2, height / 2);
  let newscale = 50 / ship.size;
  zoom = lerp(zoom, newscale, 0.1);
  scale(zoom);
  translate(-ship.pos.x, -ship.pos.y);

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

  for (let i = ships.length - 1; i >= 0; i--) {
    if (socket.id !== ships[i].id) {
      push();
      translate(ships[i].x, ships[i].y);
      rotate(ships[i].heading);
      fill(0);
      stroke(255, 0 ,0);

      beginShape();
      vertex(-2 / 3 * ships[i].size, -ships[i].size);

      vertex(4 / 3 * ships[i].size, 0);

      vertex(-2 / 3 * ships[i].size, ships[i].size);

      vertex(0 / 3 * ships[i].size, 0);
      vertex(-2 / 3 * ships[i].size, -ships[i].size);
      endShape();
      pop();
      fill(255);
      textAlign(CENTER);
      textSize(TEXT_SIZE);
      text(ships[i].id + '\n <3: ' + ships[i].health + '/' + ship.health, ships[i].x, ships[i].y + ships[i].size * 2);
    } else {
      if (ships[i].health <= 0) {
        ships[i].health = 100;
        ships[i].x = 0;
        ships[i].y = 0;
        ships[i].heading = 0;
      }
      fill(255);
      textAlign(CENTER);
      textSize(TEXT_SIZE);
      text(ships[i].id + '\n <3: ' + ships[i].health + '/' + ship.health, ship.pos.x, ship.pos.y + ship.size * 2);
    }
  }

  for (let i = dust.length - 1; i >= 0; i--) {
    dust[i].render();
    if (ship.collectDust(dust[i])) {
      socket.emit('updatedust', i);
    }
  }

  for (let i = moon.length - 1; i >= 0; i--) {
    moon[i].render();
    if (ship.moonGravity(moon[i])) {

    }
  }


  ship.render();
  ship.update();
  ship.shipRotate();
  ship.edges();
  ship.state();

  for (let i = ships.length - 1; i >= 0; i--) {
    if (ships[i].id === socket.id) {
      let shipData = {
        x: ship.pos.x,
        y: ship.pos.y,
        heading: ship.heading,
        size: ship.size,
        health: ships[i].health
      }
      socket.emit('update', shipData);
    }
  }
}

function keyPressed() {
  if (keyCode == RIGHT_ARROW || keyCode == 68) {
    ship.rotation = 0.1;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    ship.rotation = -0.1;
  } else if (keyCode == UP_ARROW || keyCode == 87) {
    ship.engineWorking(true);
  } else if (keyCode == 69) {
    // On Press 'E'
    ship.turnedOn(ship.isTuredOn == false ? true : false);
  } else if (keyCode == 16) {
    // On Press 'Shift'
    ship.boostOn(true);
  } else if (keyCode == 32) {
    // On Press 'Space'
    let weaponData = {
      x: ship.pos.x,
      y: ship.pos.y,
      heading: ship.heading
    }
    socket.emit('weapon', weaponData);
  }

}

function keyReleased() {
  if (keyCode == UP_ARROW || keyCode == 87) {
    ship.engineWorking(false);
  } else if (keyCode == RIGHT_ARROW || keyCode == 68 ) {
    ship.rotation = 0;
  } else if (keyCode == LEFT_ARROW || keyCode == 65) {
    ship.rotation = 0;
  } else if (keyCode == 16) {
    // On Release 'Shift'
    ship.boostOn(false);
  } else if (keyCode == 32) {
    // On Release 'Space'
  }
}