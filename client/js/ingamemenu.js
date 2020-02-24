//Exit Game Button
//////////////////////////////////////////////////////////////////////////////

//button to exit the game entirely
var exitGameButton = new Button(
    "EXIT\nGAME",
    gameSettings.colors.darkpink,
    gameSettings.colors.pink
);

function drawExitGameButton() {
    exitGameButton.update(
        windowWidth - 100, 
        windowHeight - 100, 
        windowHeight/8, 
        windowHeight/8
    );
    exitGameButton.draw();
}


// CLASS MENU
//////////////////////////////////////////////////////////////////////////////

var classButtons = {};

for (let className in gameSettings.classes) {
    classButtons[className] = new Button(
        className.toUpperCase(),
        gameSettings.classes[className].colors.dark,
        gameSettings.classes[className].colors.light
    );
}

var classCount = Object.keys(classButtons).length;

function drawClassMenu () {
    push();
    textAlign(CENTER, CENTER);

    
    //update and draw buttons
    let counter = 1;
    for (let className in classButtons) {
        let button = classButtons[className];
        button.update(
            windowWidth/2, 
            windowHeight*counter/(1+classCount), 
            windowWidth/3,
            windowHeight/(4+classCount)
        );
        button.draw();
        counter++;
    }

    //draw text
    stroke('black');
    strokeWeight(3);
    fill(gameSettings.colors.white);
    textSize(40);
    text("Choose a Class:", windowWidth/2, windowHeight/12);
    pop();
}

function clickClassMenu () {
    for (let className in classButtons) {
        if (classButtons[className].mouseOver()) {
            return className;
        }
    }
    return false;
}

// NO LIVES MENU
//////////////////////////////////////////////////////////////////////////////

function drawNoLivesMenu () {
    push();
    textAlign(CENTER, CENTER);

    //draw text
    stroke('black');
    strokeWeight(3);
    fill(gameSettings.colors.red);
    textSize(60);
    text("No Lives Remaining", windowWidth/2, windowHeight/2);
    pop();
}

// GAME OVER MENU
//////////////////////////////////////////////////////////////////////////////

var restartButton = new Button (
    "NEW GAME",
    gameSettings.colors.darkgreen,
    gameSettings.colors.green
);

function drawGameOverMenu () {
    console.log('drawing go')
    push();
    textAlign(CENTER, CENTER);

    //update and draw restart button
    restartButton.update(
        windowWidth/2,
        windowHeight*2/3,
        windowWidth/3,
        windowHeight/8,
    )

    restartButton.draw();

    //draw text
    stroke('black');
    strokeWeight(3);
    fill(gameSettings.colors.red);
    textSize(60);
    text("GAME OVER", windowWidth/2, windowHeight/3);

    fill(gameSettings.colors.white);
    text(`WAVE: ${gameData.waveCount}`, windowWidth/2, windowHeight/2);
    pop();
}

function clickGameOverMenu() {
    return restartButton.mouseOver();
}

// In Game Menu State Machine
//////////////////////////////////////////////////////////////////////////////

var inGameMenuState;//can be 'dead'

//draw in game menus
function drawInGameMenus () {
    //darken game screen
    background(0, 200);

    switch (inGameMenuState) {
        case 'dead':
            //if game is over
            if (gameData.gameOver) {
                drawGameOverMenu();
            }
            //if lives left, select new class
            else if (gameData.livesCount > 0) {
                drawClassMenu();
            }
            //if no lives left
            else {
                drawNoLivesMenu();
            }
            break;
    }

    drawExitGameButton();

    drawMenuCrosshair();
}

function inGameMenuMouseClicked (socket) {
    if(exitGameButton.mouseOver()) {
        errors.displayError('Left Game', 5000);
        restartMenus();
        socket.close();
        return;
    }

    switch (inGameMenuState) {
        case 'dead':
            if (gameData.gameOver) {
                if (clickGameOverMenu()) {
                    socket.emit('restart_game');
                }
            }
            else if (gameData.livesCount > 0 &&
                clickClassMenu()) {
                    socket.emit('class_choice', clickClassMenu());
            }
            break;
    }
}