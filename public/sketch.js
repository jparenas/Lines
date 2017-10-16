var cnv;

var stage = 0;

var socket;

var input;
var button;
var newButton;
var shareLink;

var windowX;
var windowY;
var padding = 30;
var rectScale = 6;
var rectDisplace = rectScale/2;

var currentFirstAlpha = 255;
var firstAlpha = 255;
var currentSecondAlpha = 0;
var secondAlpha = 0;
var currentThirdAlpha = 0;
var thirdAlpha = 0;

var easing = 0.01;

var scl;

var timeSince = 0;
var gameTable;
var gameID;
var currentUser;

var userScore = 0;
var opponentScore = 0;

var rows = 8;

var playersOnline;

function centerCanvas() {
	windowX = (windowWidth - width) / 2;
	windowY = (windowHeight - height) / 2;
	cnv.position(windowX, windowY);
}

function setup() {
	socket = io.connect(window.location.protocol + "//"+ window.location.hostname + ":3000");

	cnv = createCanvas(600+padding, 600+padding);

	centerCanvas();

	//Sets up the different sockets and their listeners
	socket.on("new-game", function (data) {
		gameTable = data.gameTable;
		gameID = data.id;
		currentUser = data.currentUser;
		scl = (width-padding*2)/gameTable.length;
		button.style("opacity", 0);
		input.style("opacity", 0);
		newButton.style("opacity", 0);
		if (shareLink) {
			shareLink.style("opacity", 0);
		}
		timeSince = millis();
		firstAlpha = 0;
		secondAlpha = 0;
		thirdAlpha = 255;
		stage = 2;
		console.log(gameID);
	});

	socket.on("id", function (data) {
		stage = 1;
		button.style("opacity", 0);
		input.style("opacity", 0);
		newButton.style("opacity", 0);
		timeSince = millis();
		gameID = data;
		firstAlpha = 0;
		secondAlpha = 255;
		shareLink = createInput(window.location.host + "#" + gameID);
		shareLink.class("share_input");
		shareLink.style("width", "250px");
		shareLink.attribute("readonly", "readonly");
		shareLink.position(windowWidth/2-125, windowHeight/2+50);
		setTimeout(function () {
			shareLink.style("opacity", 100);
		}, 500);
	});

	socket.on("err", function (data) {
		showError(data.msg);
	})

	socket.on("update", function (data) {
		gameTable = data.gameTable;
		currentUser = data.currentUser;
		userScore = 0;
		opponentScore = 0;
		for (indexX in gameTable) {
      for (indexY in gameTable[indexX]) {
        if (gameTable[indexX][indexY].owner == socket.id) {
          userScore++;
        }
				else if (gameTable[indexX][indexY].owner != "none") {
					opponentScore++;
				}
      }
    }
		console.log(currentUser);
	});

	socket.on("reload", function (data) {
		alert("Opponent has disconnected. Reloading!")
		location.reload(true);
	});

	socket.on("players_online", function (data) {
		playersOnline = data;
	});

	socket.on("game_ended", function (data) {
		gameTable = data;
		for (indexX in gameTable) {
      for (indexY in gameTable[indexX]) {
        if (gameTable[indexX][indexY].owner == socket.id) {
          userScore++;
        }
				else if (gameTable[indexX][indexY].owner != "none") {
					opponentScore++;
				}
      }
    }
		if (userScore > opponentScore) {
			alert("You won!\nRefresh the page to play again!");
		}
		else if (userScore < opponentScore) {
			alert("You lost!\nRefresh the page to play again!");
		}
		else {
			alert("It was a tie!\nRefresh the page to play again!");
		}
	});

	input = createInput();
	input.position(windowWidth/2 - 95, windowHeight/2);
	input.class("login_input");
	input.style("width", "185px");

	button = createButton('Join Game');
  button.position(windowWidth/2 - 95, windowHeight/2 + 28);
	button.class("login_button");
  button.mousePressed(function() {
		joinGame(input.value());
	});

	newButton = createButton('New Game');
  newButton.position(windowWidth/2, windowHeight/2 + 28);
	newButton.class("login_button");
  newButton.mousePressed(function() {
		newGame();
	});

	if(window.location.hash.substr(1)) {
		joinGame(window.location.hash.substr(1));
		return;
	}
}

function draw() {
	updateObjects();

	if (millis() - timeSince >= 2000 && timeSince != 0) {
		button.hide();
		input.hide();
		newButton.hide();
		if (shareLink && stage != 1) {
			shareLink.hide();
		}
	}
	if (stage == 0) {
		background(171, 171, 171, currentFirstAlpha);
		fill(255, 255, 255, currentFirstAlpha);
		textAlign("center");
		textSize(150);
		text("Lines", width/2, 200);
		textSize(20);
		text("Players Online: " + playersOnline, width/2, height-50);
	} else if (stage == 1) {
		background(0, 0, 0, currentSecondAlpha);
		fill(255, 255, 255, currentSecondAlpha);
		textAlign("center");
		textSize(40);
		text("ID: " + gameID, width/2, height/2);
	} else if (stage == 2) {
		background(255, 255, 255, currentThirdAlpha*0.6);
		noStroke();
		for (var i = 0; i < gameTable.length; i++) {
      for (var k = 0; k < gameTable[i].length; k++) {
				if (gameTable[i][k].owner == socket.id) {
					fill(228, 115, 23, currentThirdAlpha);
					rect((i*scl)+padding, (k*scl)+padding, scl, scl);
				} else if (gameTable[i][k].owner != "none") {
					fill(72, 198, 228, currentThirdAlpha);
					rect((i*scl)+padding, (k*scl)+padding, scl, scl);
				}

				if (gameTable[i][k].top == socket.id) {
					fill(228, 115, 23, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+padding-3, scl+6, 6, 6);
				} else if (gameTable[i][k].top != "none") {
					fill(72, 198, 228, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+padding-3, scl+6, 6, 6);
				}
				if (gameTable[i][k].bottom == socket.id) {
					fill(228, 115, 23, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+scl+padding-3, scl+6, 6, 6);
				} else if (gameTable[i][k].bottom != "none") {
					fill(72, 198, 228, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+scl+padding-3, scl+6, 6, 6);
				}
				if (gameTable[i][k].right == socket.id) {
					fill(228, 115, 23, currentThirdAlpha);
					rect((i*scl)+scl+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				} else if (gameTable[i][k].right != "none") {
					fill(72, 198, 228, currentThirdAlpha);
					rect((i*scl)+scl+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				}
				if (gameTable[i][k].left == socket.id) {
					fill(228, 115, 23, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				} else if (gameTable[i][k].left != "none") {
					fill(72, 198, 228, currentThirdAlpha);
					rect((i*scl)+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				}
				//Top
				if (checkMouse("top", i, k)) {
					fill(228, 115, 23, 70*(currentThirdAlpha/100));
					rect((i*scl)+padding-3, (k*scl)+padding-3, scl+6, 6, 6);
				}
				//Bottom
				else if (checkMouse("bottom", i, k)) {
					fill(228, 115, 23, 70*(currentThirdAlpha/100));
					rect((i*scl)+padding-3, (k*scl)+scl+padding-3, scl+6, 6, 6);
				}
				//Right
				else if (checkMouse("right", i, k)) {
					fill(228, 115, 23, 70*(currentThirdAlpha/100));
					rect((i*scl)+scl+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				}
				//Left
				else if (checkMouse("left", i, k)) {
					fill(228, 115, 23, 70*(currentThirdAlpha/100));
					rect((i*scl)+padding-3, (k*scl)+padding-3, 6, scl+6, 6);
				}
				fill(0, 0, 0, currentThirdAlpha);
				ellipse((i*scl)+padding, (k*scl)+padding, 4, 4);
				ellipse((i*scl)+padding, (k*scl)+scl+padding, 4, 4);
				ellipse((i*scl)+scl+padding, (k*scl)+padding, 4, 4);
				ellipse((i*scl)+scl+padding, (k*scl)+scl+padding, 4, 4);
      }
    }
		if (currentUser == socket.id) {
			fill(0, 0, 0, currentThirdAlpha);
			textAlign(CENTER, BOTTOM);
			textSize(16);
			text("Your turn!", width/2, height);
		}
		fill(228, 115, 23, currentThirdAlpha);
		textAlign(LEFT, BOTTOM);
		textSize(16);
		text("Your score: " + userScore, 0, height);
		fill(72, 198, 228, currentThirdAlpha);
		textAlign(RIGHT, BOTTOM);
		text("Opponent score: " + opponentScore, width, height);
		console.log(currentThirdAlpha);
	}
	else {
		background(255);
	}
}

function checkMouse(side, i, k) {
	if (side == "top") {
		if (mouseX > (i*scl)+padding+rectDisplace && mouseX <= (i*scl)+scl+padding-rectDisplace && mouseY > (k*scl)+padding-rectDisplace && mouseY <= (k*scl)+padding+rectDisplace) {
			return true;
		}
		return false;
	}
	if (side == "bottom") {
		if (mouseX > (i*scl)+padding+rectDisplace && mouseX <= (i*scl)+scl+padding-rectDisplace && mouseY > (k*scl)+scl+padding-rectDisplace && mouseY <= (k*scl)+scl+padding+rectDisplace) {
			return true;
		}
		return false;
	}
	if (side == "right") {
		if (mouseX > (i*scl)+scl+padding-rectDisplace && mouseX <= (i*scl)+scl+padding+rectDisplace && mouseY > (k*scl)+padding+rectDisplace && mouseY <= (k*scl)+scl+padding-rectDisplace) {
			return true;
		}
		return false;
	}
	if (side == "left") {
		if (mouseX > (i*scl)+padding-rectDisplace && mouseX <= (i*scl)+padding+rectDisplace && mouseY > (k*scl)+padding+rectDisplace && mouseY <= (k*scl)+scl+padding-rectDisplace) {
			return true;
		}
		return false;
	}
	return false;
}

function mouseClicked() {
	if(stage == 2 && millis() - timeSince >= 1000) {
		if (currentUser != socket.id) {
			console.log("Wrong turn.");
			console.log(currentUser);
			console.log(socket.id);
			return false;
		}
		for (var i = 0; i < gameTable.length; i++) {
			for (var k = 0; k < gameTable[i].length; k++) {
				//Top
				if (checkMouse("top", i, k) && gameTable[i][k].top == "none") {
					socket.emit("update", {id:gameID, x:i, y:k, side:"top", lastTurn: socket.id});
					return false;
				}
				//Bottom
				else if (checkMouse("bottom", i, k) && gameTable[i][k].bottom == "none") {
					socket.emit("update", {id:gameID, x:i, y:k, side:"bottom", lastTurn: socket.id});
					return false;
				}
				//Right
				else if (checkMouse("right", i, k) && gameTable[i][k].right == "none") {
					socket.emit("update", {id:gameID, x:i, y:k, side:"right", lastTurn: socket.id});
					return false;
				}
				//Left
				else if (checkMouse("left", i, k) && gameTable[i][k].left == "none") {
					socket.emit("update", {id:gameID, x:i, y:k, side:"left", lastTurn: socket.id});
					return false;
				}
			}
		}
	}
	return true;
}

function updateObjects() {
	if (currentFirstAlpha != firstAlpha) {
		currentFirstAlpha += float(firstAlpha - currentFirstAlpha)*easing;
		if (currentFirstAlpha - firstAlpha < 3 && currentFirstAlpha - firstAlpha > -3) {
			currentFirstAlpha = firstAlpha;
		}
	}

	if (currentSecondAlpha != secondAlpha) {
		currentSecondAlpha += float(secondAlpha - currentSecondAlpha)*easing;
		if (currentSecondAlpha - secondAlpha < 3 && currentSecondAlpha - secondAlpha > -3) {
			currentSecondAlpha = secondAlpha;
		}
	}

	if (currentThirdAlpha != thirdAlpha) {
		currentThirdAlpha += float(thirdAlpha - currentThirdAlpha)*easing;
		if (currentThirdAlpha - thirdAlpha < 3 && currentThirdAlpha - thirdAlpha > -3) {
			currentThirdAlpha = thirdAlpha;
		}
	}
}

function windowResized() {
	centerCanvas();
}

function changeStage(stageIndex) {
	stage = stageIndex;
	if (stageIndex == 2) {
		newGame();
		button.style("opacity", 0);
		input.style("opacity", 0);
	}
	timeSince = millis();
}

function showError(errorMsg) {
	alert(errorMsg);
}

function joinGame(gameID) {
	socket.emit("join-game", {id:gameID});
}

function newGame() {
	var data = {
		id: socket.id,
		rows: rows,
		cols: rows,
	};
	socket.emit("new-game", data);
}
