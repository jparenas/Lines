var express = require("express");
var socket = require("socket.io");

var app = express();
var server = app.listen(3000);

app.use(express.static("public"));

var io = socket(server);

//Local games, referenced by their ids

var games = {};
var clients = {};

io.sockets.on("connection", function (socket) {
  var playerCount = 0;
  for (index in io.sockets.sockets) {
    if (!clients[index]) {
      playerCount++;
    }
  }
  for (index in io.sockets.sockets) {
    if (!clients[index]) {
      io.sockets.sockets[index].emit("players_online", playerCount);
    }
  }
  
  socket.on("join-game", function(data) {
    if (data.id == "") {
      /*
      var listOfIDs = [];
      if (Object.keys(games).length == 0) {
        return;
      }
      for (index in games) {
        if (games[index]["ids"].length <= 1) {
          listOfIDs.push(index);
        }
      }
      var id = listOfIDs[Math.floor(Math.random(0, listOfIDs.length))];
      clients[socket.id] = id;
      games[id]["ids"].push(socket.id);
      console.log(id);
      console.log(games[id]["ids"]);
      console.log(games[id]);
      socket.emit("new-game", games[id]);
      io.sockets.sockets[games[id]["ids"][1-(games[id]["ids"].indexOf(socket.id))]].emit("new-game", games[id]); */
      socket.emit("err", {msg:"ID must be filled!"});
      return;
    }
    if (games[data.id]) {
      if (games[data.id]["ids"].length > 1) {
        socket.emit("err", {msg:"Game is already in progress!"});
      } else {
        clients[socket.id] = data.id;
        games[data.id]["ids"].push(socket.id);
        socket.emit("new-game", games[data.id]);
        io.sockets.sockets[games[data.id]["ids"][1-(games[data.id]["ids"].indexOf(socket.id))]].emit("new-game", games[data.id]);
      }
    }
    else {
      socket.emit("err", {msg:"ID does not exist!"});
    }
  });

  socket.on("new-game", function(data) {
    var setID = true;
    var id;
    while(setID) {
      id = 1000 + Math.floor(Math.random()*8999);
      if (!games[id]) {
        setID = false;
      }
    }
    games[id] = {
      id: id,
      ids: [socket.id],
      gameTable: [],
      currentUser: socket.id,
    }
    for (var i = 0; i < data.cols; i++) {
      games[id]["gameTable"].push([]);
      for (var k = 0; k < data.rows; k++) {
        games[id]["gameTable"][i].push({
          top: "none",
          bottom: "none",
          right: "none",
          left: "none",
          owner: "none",
        });
      }
    }
    clients[socket.id] = id;
    console.log("Created game with ID: " + id);
    io.sockets.sockets[socket.id].emit("id", id);
  });

  socket.on("update", function(data) {
    if (data.lastTurn != games[data.id].currentUser || games[data.id]["ids"].length < 2) {
      return;
    }
    if (data.side == "top") {
      games[data.id].gameTable[data.x][data.y].top = data.lastTurn;
      if (games[data.id].gameTable[data.x][data.y-1]) {
        games[data.id].gameTable[data.x][data.y-1].bottom = data.lastTurn;
      }
    }
    else if (data.side == "bottom") {
      games[data.id].gameTable[data.x][data.y].bottom = data.lastTurn;
      if (games[data.id].gameTable[data.x][data.y+1]) {
        games[data.id].gameTable[data.x][data.y+1].top = data.lastTurn;
      }
    }
    else if (data.side == "right") {
      games[data.id].gameTable[data.x][data.y].right = data.lastTurn;
      if (games[data.id].gameTable[data.x+1]) {
        if (games[data.id].gameTable[data.x+1][data.y]) {
          games[data.id].gameTable[data.x+1][data.y].left = data.lastTurn;
        }
      }
    }
    else if (data.side == "left") {
      games[data.id].gameTable[data.x][data.y].left = data.lastTurn;
      if (games[data.id].gameTable[data.x-1]) {
        if (games[data.id].gameTable[data.x-1][data.y]) {
          games[data.id].gameTable[data.x-1][data.y].right = data.lastTurn;
        }
      }
    }
    var repeatTurn = false;
    if (checkOwner(data.id, data.x, data.y)) {
      games[data.id].gameTable[data.x][data.y].owner = data.lastTurn;
      repeatTurn = true;
    }
    if (checkOwner(data.id, data.x-1, data.y)) {
      games[data.id].gameTable[data.x-1][data.y].owner = data.lastTurn;
      repeatTurn = true;
    }
    if (checkOwner(data.id, data.x+1, data.y)) {
      games[data.id].gameTable[data.x+1][data.y].owner = data.lastTurn;
      repeatTurn = true;
    }
    if (checkOwner(data.id, data.x, data.y-1)) {
      games[data.id].gameTable[data.x][data.y-1].owner = data.lastTurn;
      repeatTurn = true;
    }
    if (checkOwner(data.id, data.x, data.y+1)) {
      games[data.id].gameTable[data.x][data.y+1].owner = data.lastTurn;
      repeatTurn = true;
    }
    var ownerCheck = false;
    for (indexX in games[data.id].gameTable) {
      for (indexY in games[data.id].gameTable[indexX]) {
        if (games[data.id].gameTable[indexX][indexY].owner == "none") {
          ownerCheck = true;
          break;
        }
      }
      if (ownerCheck) {
        break;
      }
    }
    if (!ownerCheck) {
      for (index in games[data.id]["ids"]) {
        io.sockets.sockets[games[data.id]["ids"][index]].emit("game_ended", games[data.id].gameTable);
        delete clients[index];
      }
      delete games[clients[data.id]];
      return;
    }
    if (repeatTurn) {
      games[data.id].currentUser = data.lastTurn;
    } else {
      games[data.id].currentUser = games[data.id]["ids"][1-(games[data.id]["ids"].indexOf(data.lastTurn))];
    }
    console.log("ID: " + data.id + " Current User: " + games[data.id].currentUser)
    for (index in games[data.id]["ids"]) {
      io.sockets.sockets[games[data.id]["ids"][index]].emit("update", {gameTable: games[data.id].gameTable, currentUser:games[data.id].currentUser});
    }
  })

  socket.on("disconnect", function() {
    if (clients[socket.id]) {
      if (games[clients[socket.id]]) {
        for (index in games[clients[socket.id]]["ids"]) {
          if (socket.id != games[clients[socket.id]]["ids"][index]) {
            io.sockets.sockets[games[clients[socket.id]]["ids"][index]].emit("reload", true);
            delete clients[index];
          }
        }
        console.log("Deleted game with ID: " + clients[socket.id]);
        delete games[clients[socket.id]];
      }
    }
    var playerCount = 0;
    for (index in io.sockets.sockets) {
      if (!clients[index]) {
        playerCount++;
      }
    }
    for (index in io.sockets.sockets) {
      if (!clients[index]) {
        io.sockets.sockets[index].emit("players_online", playerCount);
      }
    }
  })
});

function checkOwner(id ,i, k) {
  if (games[id].gameTable[i]) {
    if (games[id].gameTable[i][k]) {
      if (games[id].gameTable[i][k].top != "none" && games[id].gameTable[i][k].bottom != "none" && games[id].gameTable[i][k].left != "none" && games[id].gameTable[i][k].right != "none") {
        if(games[id].gameTable[i][k].owner == "none") {
          return true;
        }
      }
    }
  }
  return false;
}
