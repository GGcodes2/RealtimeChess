const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "ChessGG" });
});

io.on("connection", function (uniqueSocket) {
  console.log("New client connected:", uniqueSocket.id);


  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
    console.log("Assigned white to", uniqueSocket.id);
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
    console.log("Assigned black to", uniqueSocket.id);
  } else {
    uniqueSocket.emit("spectatorRole");
    console.log("Assigned spectator role to", uniqueSocket.id);
  }


  uniqueSocket.emit("boardState", chess.fen());


  uniqueSocket.on("disconnect", function () {
    if (uniqueSocket.id === players.white) {
      delete players.white;
      console.log("White player disconnected");
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
      console.log("Black player disconnected");
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      const currentTurn = chess.turn();
      const isWhitePlayer = uniqueSocket.id === players.white;
      const isBlackPlayer = uniqueSocket.id === players.black;

      if ((currentTurn === "w" && !isWhitePlayer) || (currentTurn === "b" && !isBlackPlayer)) {
        console.log("Move rejected: not your turn.");
        return;
      }

      const result = chess.move(move);

      if (result) {
        console.log(`Move made: ${move.from} -> ${move.to}`);
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move attempted:", move);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.error("Error processing move:", err);
      uniqueSocket.emit("error", "Server error while processing the move.");
    }
  });
});

server.listen(3000, function () {
  console.log("Server listening on port 3000");
});
