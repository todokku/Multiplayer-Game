//player info from server
var players = {};

//shots info from server
var shots = {};

//pickups info from server
var pickups = {};

//object to hold info re: screen offset based on player position
var screenOffset = {
    x:0,
    y:0,
}

// hold time of death
var deathStart;

//conglomerate draw function for game objects
function drawGame () {
    if (socket.id in players) {
        let player = players[socket.id];

        push();

        //refresh screen
        clear()

        //calculate screen offset based on player position
        calcOffset(player);

        //draw grid background
        drawGrid();

        //draw game area borders
        drawBorders();

        //draw dead players
        drawDead();

        //draw client player if dead
        if (player.health <= 0) {
            drawPlayer(player);
        }

        //draw pickups
        drawPickups();

        //draw all shots
        drawShots();

        //draw living players
        drawLiving();

        // then draw client player on top if living
        if (player.health > 0) {
            drawPlayer(player);
        }

        //draw death message if client player is dead
        deathMsg(player);

        //draw UI

        //draw minimap
        drawMinimap();

        if (player.health > 0) {
            //draw healthbar, then erase time of death
            drawHealthbar(player);
            deathStart = 0;
        } else {
            //note time of death, then draw respawn bar
            if (deathStart == 0) {
                deathStart = (new Date()).getTime();
            }
            let deathTime = (new Date()).getTime() - deathStart;
            drawMainbar(player, deathTime/gameSettings.respawnTime);
        }

        //draw info about the current gameRoom
        drawRoomId(player);

        //draw names of players
        drawPlayerInfo();

        // draw crosshair
        drawCrosshair(player);

        pop();
    }
}

//calculate screen offset based on player position
function calcOffset (player) {

    let margin = 100;
    
    //account for screens too large for the game area
    if (windowWidth > gameSettings.width + 2*margin) {
        screenOffset.x = (gameSettings.width-windowWidth)/2;
    }
    else {
        screenOffset.x = Math.min(Math.max(-margin, player.x - windowWidth/2), gameSettings.width-windowWidth + margin);
    }
    if (windowHeight > gameSettings.height + 2*margin) {
        screenOffset.y = (gameSettings.height-windowHeight)/2;
    }
    else {
        screenOffset.y = Math.min(Math.max(-margin, player.y - windowHeight/2), gameSettings.height-windowHeight + margin);
    }
}

//draw grid to visually indicate movement around world
function drawGrid () {
    push();
    strokeWeight(1);
    stroke('#C2C3C7');
    background('#FFF1E8');
    for (let x = 100; x < gameSettings.width; x+=100) {
        if (x-screenOffset.x > 0 &&
            x-screenOffset.x < windowWidth) {
                line(
                    x-screenOffset.x, 0,
                    x-screenOffset.x, windowHeight
                );
        }
    }
    for (let y = 100; y < gameSettings.height; y+=100) {
        if (y-screenOffset.y > 0 &&
            y-screenOffset.y < windowHeight) {
                line(
                    0, y-screenOffset.y,
                    windowWidth, y-screenOffset.y
                );
        }
    }
    pop();
}

//draws edge of game area
function drawBorders () {
    push();
    strokeWeight(0);
    fill('#C2C3C7');
    rectMode(CORNERS);
    //left
    if (screenOffset.x < 0) {
        rect(
            0, 0, 
            -screenOffset.x, windowHeight
        )
    }
    //right
    if (screenOffset.x > gameSettings.width-windowWidth) {
        rect(
            gameSettings.width - screenOffset.x, 0, 
            windowWidth, windowHeight
        )
    }
    //top
    if (screenOffset.y < 0) {
        rect(
            0, 0, 
            windowWidth, -screenOffset.y
        )
    }
    //bottom
    if (screenOffset.y > gameSettings.height-windowHeight) {
        rect(
            0, gameSettings.height - screenOffset.y, 
            windowWidth, windowHeight
        )
    }
    pop();
}

//draws pickup-able objects
function drawPickups() {
    push();
    fill('#FF004D');
    stroke('black');
    strokeWeight(4);
    for (let id in pickups) {
        let pickup = pickups[id];
        if (pickup.x-screenOffset.x > -50 &&
            pickup.x-screenOffset.x < windowWidth + 50 &&
            pickup.y-screenOffset.y > -50 &&
            pickup.y-screenOffset.y < windowHeight + 50) {
                if (pickup.type == 'health') {
                    fill('#FF004D');
                    //draw rect
                    rect(
                        pickup.x-screenOffset.x - 20,
                        pickup.y-screenOffset.y - 20,
                        40,
                        40
                    )
                    //draw cross
                    push();
                    fill('#FFF1E8');
                    strokeWeight(0);
                    rect(
                        pickup.x-screenOffset.x - 10,
                        pickup.y-screenOffset.y - 3,
                        20,
                        6
                    )
                    rect(
                        pickup.x-screenOffset.x - 3,
                        pickup.y-screenOffset.y - 10,
                        6,
                        20
                    )
                    pop();
                }
        }
    }
    pop();
}

//draw all shots
function drawShots() {
    push();
    strokeWeight(2);
    for (let id in shots) {
        let shot = shots[id];
        if (shot.x-screenOffset.x > 0 &&
            shot.x-screenOffset.x < windowWidth &&
            shot.y-screenOffset.y > 0 &&
            shot.y-screenOffset.y < windowHeight) {
                fill(gameSettings.classes[shot.class].colors[0]);
                stroke(gameSettings.classes[shot.class].colors[1]);
                ellipse(shot.x-screenOffset.x, shot.y-screenOffset.y, 10, 10);
        }
    }
    pop();
}

//draw dead players 
function drawDead () {
    push();
    for (let id in players) {
        if (id != socket.id) {
            let player = players[id];
            if (player.health <= 0 &&
                player.x-screenOffset.x > -50 &&
                player.x-screenOffset.x < windowWidth + 50 &&
                player.y-screenOffset.y > -50 &&
                player.y-screenOffset.y < windowHeight + 50) {
                    //draw player as transparent
                    let fillcolor = color(gameSettings.classes[player.class].colors[0]);
                    fillcolor.setAlpha(100);
                    let strokecolor = color(gameSettings.classes[player.class].colors[1]);
                    strokecolor.setAlpha(100)
                    fill(fillcolor);
                    stroke(strokecolor);
                    strokeWeight(2);
                    ellipse(
                        player.x-screenOffset.x, player.y-screenOffset.y, 
                        gameSettings.playerRadius*2 - 1, 
                        gameSettings.playerRadius*2 - 1
                    );

                    //draw death cross
                    strokeWeight(5);
                    stroke('#FF004D');
                    line(player.x-screenOffset.x+25,
                        player.y-screenOffset.y+25,
                        player.x-screenOffset.x-25,
                        player.y-screenOffset.y-25);
                    line(player.x-screenOffset.x+25,
                        player.y-screenOffset.y-25,
                        player.x-screenOffset.x-25,
                        player.y-screenOffset.y+25);
            }
        }
    }
    pop();
}

//draw living players
function drawLiving () {
    push();
    for (let id in players) {
        if (id != socket.id) {
            let player = players[id];
            if (player.health > 0 &&
                player.x-screenOffset.x > -50 &&
                player.x-screenOffset.x < windowWidth + 50 &&
                player.y-screenOffset.y > -50 &&
                player.y-screenOffset.y < windowHeight + 50) {
                    //draw player
                    fill(gameSettings.classes[player.class].colors[0]);
                    stroke(gameSettings.classes[player.class].colors[1]);
                    strokeWeight(2);
                    ellipse(
                        player.x-screenOffset.x, player.y-screenOffset.y, 
                        gameSettings.playerRadius*2 - 1, 
                        gameSettings.playerRadius*2 - 1
                    );

                    //draw healthbar
                    let x_offset = 15
                    let y_offset_abs = 35;
                    let y_offset = y_offset_abs;
                    if (player.y-screenOffset.y > windowHeight - 50) {
                        y_offset = -35;
                    }
                    stroke(gameSettings.classes[player.class].colors[1]);
                    strokeWeight(2);
                    fill('black');
                    rect(
                        player.x - x_offset-screenOffset.x, player.y + y_offset-screenOffset.y, 
                        x_offset*2, 5*(y_offset/y_offset_abs),
                    );
                    strokeWeight(0);
                    fill(gameSettings.classes[player.class].colors[0]);
                    rect(
                        player.x - x_offset-screenOffset.x, player.y + y_offset-screenOffset.y, 
                        x_offset*2*(player.health/gameSettings.classes[player.class].maxHealth), 5*(y_offset/y_offset_abs),
                    );
            }
        }
    }
    pop();
}

//draw client's player
function drawPlayer (player) {
    push();
    fill(gameSettings.classes[player.class].colors[0]);
    stroke(gameSettings.classes[player.class].colors[1]);
    strokeWeight(2);
    ellipse(
        player.x-screenOffset.x, 
        player.y-screenOffset.y, 
        gameSettings.playerRadius*2 - 1, 
        gameSettings.playerRadius*2 - 1
    );
    //draw death cross if dead
    if (player.health <= 0) {
        strokeWeight(5);
        stroke('#FF004D');
        line(player.x-screenOffset.x+25,
             player.y-screenOffset.y+25,
             player.x-screenOffset.x-25,
             player.y-screenOffset.y-25);
        line(player.x-screenOffset.x+25,
             player.y-screenOffset.y-25,
             player.x-screenOffset.x-25,
             player.y-screenOffset.y+25);
    }
    pop();
}

//tint screen and display message when player is dead
function deathMsg (player) {
    if (player.health <= 0) {
        push();
        textAlign(CENTER, CENTER);
        background(0, 200);
        fill(gameSettings.classes[player.class].colors[0]);
        stroke('black');
        strokeWeight(3);
        textSize(40);
        text("YOU ARE DEAD", windowWidth/2, windowHeight/2);
        pop();
    }
}

//draw cosshair
function drawCrosshair (player) {
    push();
    stroke(gameSettings.classes[player.class].colors[1]);
    strokeWeight(2);
    fill(0,0);
    ellipse(mouseX, mouseY, 30, 30);
    line(mouseX+20, mouseY, mouseX-20, mouseY);
    line(mouseX, mouseY+20, mouseX, mouseY-20);
    pop();
}

//draws the main bar at bottom of the screen
function drawMainbar (player, prog) {
    //prog is ratio from 0 to 1
    prog = Math.min(1,Math.max(0,prog));
    push();
    strokeWeight(0);
    fill('black');
    rect(
        windowWidth/4-2, windowHeight - 27,
        windowWidth/2+4, 24,
    );
    fill(gameSettings.classes[player.class].colors[0]);
    rect(
        windowWidth/4, windowHeight - 25,
        windowWidth/2*(prog), 20
    );
    pop();
}

//draw client players healthbar
function drawHealthbar (player) {
    push();
    textAlign(CENTER, CENTER);
    drawMainbar(player, player.health/gameSettings.classes[player.class].maxHealth);
    stroke('black');
    strokeWeight(4);
    textSize(20);
    fill('#FFF1E8');
    text(player.health.toString()+' / '+gameSettings.classes[player.class].maxHealth.toString() ,windowWidth/2,windowHeight-17);
    pop();
}

//draws minimap 
function drawMinimap () {
    //settings for the minimap
    let minimapWidth = Math.min(250, Math.max(windowWidth/6, windowHeight/6));
    let minimapHeight = (minimapWidth/gameSettings.width) * gameSettings.height;
    let minimapOverflow = 3;
    let minimapOffset = {
        x:minimapOverflow + 3,
        y:windowHeight - minimapHeight - minimapOverflow - 3,
    }
    let minimapPipSize = 5;

    push();
    //draw minimap background
    strokeWeight(0);
    fill(0, 150);
    rect(
        minimapOffset.x - minimapOverflow,
        minimapOffset.y - minimapOverflow, 
        minimapWidth + minimapOverflow*2, 
        minimapHeight + minimapOverflow*2
    );

    //draw other player pips
    for (let id in players) {
        if (id != socket.id && players[id].health > 0) {
            let player = players[id];
            fill(gameSettings.classes[player.class].colors[0]);
            ellipse(
                (player.x/gameSettings.width)*minimapWidth+minimapOffset.x,
                (player.y/gameSettings.height)*minimapHeight + minimapOffset.y,
                minimapPipSize, minimapPipSize,
            );
        }
    }

    //draw client player pip with outline indicator + larger
    let player = players[socket.id];
    strokeWeight(1);
    stroke('#FFF1E8');
    fill(gameSettings.classes[player.class].colors[0]);
    ellipse(
        (player.x/gameSettings.width)*minimapWidth + minimapOffset.x,
        (player.y/gameSettings.height)*minimapHeight + minimapOffset.y,
        minimapPipSize*1.25, minimapPipSize*1.25,
    );
    pop();
}

//display room code so others can join
function drawRoomId (player) {
    push();
    textAlign(LEFT, CENTER);
    stroke('black');
    strokeWeight(0);
    textSize(30);
    fill(gameSettings.classes[player.class].colors[1]);
    text('Game Code: '+roomId, 15, 20);

    text('Players: '+Object.keys(players).length.toString()+'/'+gameSettings.roomCap, 15, 60)
    pop();
}

function drawPlayerInfo () {
    push();
    rectMode(CORNERS);
    textAlign(RIGHT, CENTER);
    stroke('black');
    strokeWeight(0);
    textSize(30);
    let counter = 0;
    for (let id in players) {
        //draw name and killstreak
        let player = players[id];
        fill(gameSettings.classes[player.class].colors[1]);
        text(player.name + ' : '+player.killStreak, windowWidth-15, 20+counter*50);
        
        //draw healthbar
        let barWidth = 110;
        let barHeight = 6;
        let barOffset = 15;
        fill('black');
        stroke(gameSettings.classes[player.class].colors[1]);
        strokeWeight(2);
        rect(
            windowWidth-(barWidth+barOffset), 40+counter*50, 
            windowWidth-(barOffset), 40+counter*50 + barHeight
        );
        strokeWeight(0);
        fill(gameSettings.classes[player.class].colors[0]);
        rect(
            windowWidth-barOffset - barWidth*(player.health/gameSettings.classes[player.class].maxHealth), 40+counter*50, 
            windowWidth-(barOffset), 40+counter*50 + barHeight
        );

        counter++;
    }
    pop();
}