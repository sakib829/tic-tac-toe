/* =========================================================
   Tic-Tac-Toe — script.js
   All game logic in vanilla JavaScript.

   Layout of this file:
     1. Constants & state
     2. DOM references
     3. Setup (build board + event listeners)
     4. Screen navigation
     5. Game flow (turn handling, placing marks)
     6. Win / draw detection
     7. Single-player AI
     8. UI updates (status, results, board reset)
   ========================================================= */

"use strict";

/* =========================================================
   1. Constants & state
   ========================================================= */

const HUMAN = "X";       // The human player is always X.
const COMPUTER = "O";    // The computer is always O.

// The eight winning combinations (rows, columns, diagonals).
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

// Game state variables.
let board = Array(9).fill("");      // "" | "X" | "O" for each of the 9 cells.
let currentPlayer = HUMAN;          // Whose turn it is.
let gameActive = false;             // True while the game is in progress.
let vsComputer = false;             // True in single-player mode.
let cellElements = [];              // The 9 cell button DOM elements.

/* =========================================================
   2. DOM references
   ========================================================= */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const boardEl = document.getElementById("board");

/* =========================================================
   3. Setup (build board + event listeners)
   ========================================================= */

function init() {
  buildBoard();

  document.getElementById("single-player-btn")
    .addEventListener("click", () => startGame("single"));
  document.getElementById("multiplayer-btn")
    .addEventListener("click", () => startGame("multi"));
  document.getElementById("play-again-btn")
    .addEventListener("click", resetGame);
  document.getElementById("main-menu-btn")
    .addEventListener("click", showMenu);
}

// Create the 9 clickable cells once and store references to them.
function buildBoard() {
  boardEl.innerHTML = "";
  cellElements = [];

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = i;
    cell.setAttribute("aria-label", `Cell ${i + 1}: empty`);
    cell.addEventListener("click", () => handleCellClick(i));
    boardEl.appendChild(cell);
    cellElements.push(cell);
  }
}

/* =========================================================
   4. Screen navigation
   ========================================================= */

function showScreen(screen) {
  menuScreen.classList.toggle("is-active", screen === "menu");
  gameScreen.classList.toggle("is-active", screen === "game");
}

// Start a fresh game in the chosen mode ("single" or "multi").
function startGame(mode) {
  vsComputer = mode === "single";
  resetGame();
  showScreen("game");
}

// Return to the main menu without reloading the page.
function showMenu() {
  gameActive = false;
  showScreen("menu");
}

/* =========================================================
   5. Game flow (turn handling, placing marks)
   ========================================================= */

function handleCellClick(index) {
  // Ignore clicks when the game is over.
  if (!gameActive) return;
  // Ignore clicks on an already-occupied cell.
  if (board[index] !== "") return;
  // Ignore clicks while it is the computer's turn.
  if (vsComputer && currentPlayer === COMPUTER) return;

  placeMark(index, currentPlayer);

  if (checkForResult()) return; // Game ended — stop here.

  switchPlayer();
  updateStatus();

  // In single-player mode, let the computer take its turn.
  if (vsComputer && currentPlayer === COMPUTER) {
    window.setTimeout(computerTurn, 450); // Small delay feels more natural.
  }
}

function placeMark(index, mark) {
  board[index] = mark;

  const cell = cellElements[index];
  cell.textContent = mark;
  cell.classList.add("taken", mark === HUMAN ? "x" : "o");
  cell.disabled = true;
  cell.setAttribute("aria-label", `Cell ${index + 1}: ${mark}`);
}

function switchPlayer() {
  currentPlayer = currentPlayer === HUMAN ? COMPUTER : HUMAN;
}

/* =========================================================
   6. Win / draw detection
   ========================================================= */

// Returns the outcome of the current board, or null if the game continues.
function getGameResult() {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combination };
    }
  }
  // Draw: every cell is filled and nobody won.
  if (board.every((cell) => cell !== "")) {
    return { winner: "draw", combination: null };
  }
  return null;
}

// Checks the board for a result and updates the UI if the game has ended.
function checkForResult() {
  const result = getGameResult();
  if (!result) return false;

  gameActive = false;

  if (result.winner === "draw") {
    showResult("draw");
  } else {
    highlightWinningCells(result.combination);
    showResult(result.winner);
  }
  return true;
}

/* =========================================================
   7. Single-player AI
   ========================================================= */

// The computer's turn: pick a move, place it, then check the result.
function computerTurn() {
  if (!gameActive) return; // Guard against a game that already ended.

  const move = getComputerMove(board);
  if (move === -1) return; // No legal move available.

  placeMark(move, COMPUTER);

  if (checkForResult()) return;

  switchPlayer();
  updateStatus();
}

// Basic but sensible AI:
//   1. Win if there is an immediate winning move.
//   2. Block the human's immediate winning move.
//   3. Take the centre, then a corner, then a side.
function getComputerMove(currentBoard) {
  const winningMove = findWinningMove(currentBoard, COMPUTER);
  if (winningMove !== -1) return winningMove;

  const blockingMove = findWinningMove(currentBoard, HUMAN);
  if (blockingMove !== -1) return blockingMove;

  if (currentBoard[4] === "") return 4;

  const freeCorners = [0, 2, 6, 8].filter((i) => currentBoard[i] === "");
  if (freeCorners.length > 0) return randomFrom(freeCorners);

  const freeSides = [1, 3, 5, 7].filter((i) => currentBoard[i] === "");
  if (freeSides.length > 0) return randomFrom(freeSides);

  return -1; // Board is full.
}

// If `player` has two marks in a line with one empty cell, return that
// empty cell's index; otherwise return -1.
function findWinningMove(currentBoard, player) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    const cells = [currentBoard[a], currentBoard[b], currentBoard[c]];
    const playerCount = cells.filter((v) => v === player).length;
    const emptyCount = cells.filter((v) => v === "").length;
    if (playerCount === 2 && emptyCount === 1) {
      return [a, b, c][cells.indexOf("")];
    }
  }
  return -1;
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/* =========================================================
   8. UI updates (status, results, board reset)
   ========================================================= */

function updateStatus() {
  statusEl.classList.remove("turn-x", "turn-o");

  if (!gameActive) {
    statusEl.textContent = "Game Over";
    return;
  }

  if (vsComputer) {
    const isHumanTurn = currentPlayer === HUMAN;
    statusEl.textContent = isHumanTurn ? "Your Turn (X)" : "Computer's Turn (O)";
    statusEl.classList.add(isHumanTurn ? "turn-x" : "turn-o");
  } else {
    const isPlayerOne = currentPlayer === HUMAN;
    statusEl.textContent = isPlayerOne
      ? "Player 1's Turn (X)"
      : "Player 2's Turn (O)";
    statusEl.classList.add(isPlayerOne ? "turn-x" : "turn-o");
  }
}

function showResult(winner) {
  resultEl.className = "result"; // reset classes

  if (winner === "draw") {
    resultEl.textContent = "It's a Draw!";
    resultEl.classList.add("draw");
  } else {
    resultEl.textContent = getWinMessage(winner);
    resultEl.classList.add(winner === HUMAN ? "win" : "lose");
  }

  updateStatus(); // Sets the status line to "Game Over".
}

function getWinMessage(winner) {
  if (winner === HUMAN) {
    return vsComputer ? "You Win! 🎉" : "Player 1 Wins! 🎉";
  }
  return vsComputer ? "Computer Wins!" : "Player 2 Wins! 🎉";
}

function highlightWinningCells(combination) {
  combination.forEach((index) => cellElements[index].classList.add("winner"));
}

// Reset the board and game state for a new round, keeping the mode.
function resetGame() {
  board = Array(9).fill("");
  currentPlayer = HUMAN; // X always moves first.
  gameActive = true;

  cellElements.forEach((cell, index) => {
    cell.textContent = "";
    cell.className = "cell";
    cell.disabled = false;
    cell.setAttribute("aria-label", `Cell ${index + 1}: empty`);
  });

  resultEl.textContent = "";
  resultEl.className = "result is-hidden";

  updateStatus();
}

/* ---------- Start the app once the DOM is ready ---------- */
document.addEventListener("DOMContentLoaded", init);

