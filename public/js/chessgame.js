const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourcesquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  const rows = playerRole === "b" ? [...board].reverse() : board;
  
  rows.forEach((row, rowIndex) => {
    const adjustedRowIndex = playerRole === "b" ? 7 - rowIndex : rowIndex;

    const cols = playerRole === "b" ? [...row].reverse() : row;
    cols.forEach((square, colIndex) => {
      const adjustedColIndex = playerRole === "b" ? 7 - colIndex : colIndex;

      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (adjustedRowIndex + adjustedColIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = adjustedRowIndex;
      squareElement.dataset.col = adjustedColIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable =
          playerRole === square.color && playerRole === chess.turn();

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourcesquare = { row: adjustedRowIndex, col: adjustedColIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourcesquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece && playerRole === chess.turn()) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourcesquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  boardElement.classList.toggle("flipped", playerRole === "b");
};

const handleMove = (source, target) => {
  const move = {
    from: String.fromCharCode(97 + source.col) + (8 - source.row),
    to: String.fromCharCode(97 + target.col) + (8 - target.row),
    promotion: "q"
  };

  const result = chess.move(move);
  if (result) {
    socket.emit("move", move);
    renderBoard();
  } else {
    console.log("Invalid move");
  }
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
  };

  const key = piece.color === "w"
    ? piece.type.toUpperCase()
    : piece.type.toLowerCase();

  return unicodePieces[key] || "";
};

socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

renderBoard();
