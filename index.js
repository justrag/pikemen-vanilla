"use strict";

const { produce } = require("immer");

/**
 * Generate an array of numbers from 0 to size-1
 *
 * @param {integer} size
 */
const range = (size) => [...Array(size).keys()];

/** @typedef {0|1|2|3|4|5|6|7} Coord */
/** @typedef {[Coord,Coord]} Coords */
/** @typedef {'red'|'blue'} Color */
/** @typedef {'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW'|'UP'} Orientation */

/** @typedef {Object} Pyramid
 * @prop {Color} [color] pyramid color
 * @prop {1|2|3} [size] pyramid size
 * @prop {Orientation} [orientation] pyramid orientation
 */

/** @typedef {[Pyramid, Pyramid, Pyramid, Pyramid, Pyramid, Pyramid, Pyramid, Pyramid]} Row */
/** @typedef {[Row, Row, Row, Row, Row, Row, Row, Row]} Board */

/** @typedef {Object} Move
 * @prop {Coords} start
 * @prop {Coords} end
 * @prop {Orientation} orientation
 */

/** @typedef {Object} State
 * @prop {Record.<Color, integer>} score
 * @prop {integer} turn
 * @prop {Color} currentPlayer
 * @prop {Color} startingPlayer
 * @prop {boolean} finished
 * @prop {Board} board
 */
/**
 * Make move
 *
 * @param {State} state
 * @param {Move} move
 * @return {State}
 */
const makeMove = (state, move) => {
  validateMove(state, move);
  const { start, end, orientation } = move;
  const [startX, startY] = start;
  const [endX, endY] = end;
  const newState = produce(state, (draft) => {
    const { board, score, currentPlayer, startingPlayer } = draft;

    const startField = board[startX][startY];
    const endField = board[endX][endY];
    const newStartField = {};
    const newEndField = {
      size: startField.size,
      color: startField.color,
      orientation,
    };

    board[startX][startY] = newStartField;
    board[endX][endY] = newEndField;

    if (currentPlayer !== startingPlayer) {
      draft.turn += 1;
    }
    if (endField.size) {
      const scored = endField.size || 0;
      score[draft.currentPlayer] += scored;
      if (score[draft.currentPlayer] >= 12) {
        draft.finished = true;
      }
    }
    draft.currentPlayer = currentPlayer === "blue" ? "red" : "blue";
  });

  return newState;
};

/**
 * Validate move
 *
 * @param {State} state
 * @param {Move} move
 * @return {void}
 */
const validateMove = (state, move) => {
  const { start, end, orientation } = move;
  const [startX, startY] = start;
  const [endX, endY] = end;
  const { board, currentPlayer } = state;
  const startField = board[startX][startY];
  const endField = board[endX][endY];

  if (startField.color !== currentPlayer) {
    throw new Error(
      `There's no ${currentPlayer}'s pyramid at (${startX},${startY})`
    );
  }

  if (startField.orientation === "UP" && (startX !== endX || startY !== endY)) {
    throw new Error(
      `${currentPlayer}'s pyramid at (${startX},${startY}) is pointing up - it can only reorient`
    );
  }

  if (
    startField.orientation === orientation &&
    startX === endX &&
    startY === endY
  ) {
    throw new Error(`Null moves are illegal`);
  }

  if (!matchesDirection(start, end, startField.orientation)) {
    throw new Error(
      `${currentPlayer}'s ${startField.size} (oriented ${startField.orientation}) cannot move from (${startX},${startY}) to (${endX},${endY})`
    );
  }

  if (isObstructed(board, start, end, startField.orientation)) {
    throw new Error(
      `The move from (${startX},${startY}) to (${endX},${endY}) is obstructed`
    );
  }

  if (!(startField.size > endField.size || endField.orientation !== "UP")) {
    throw new Error(
      `Attacking piece is not bigger than defending piece and the defending piece is oriented UP`
    );
  }
};

const orientationToCoords = {
  N: [0, 1],
  NE: [1, 1],
  E: [1, 0],
  SE: [1, -1],
  S: [0, -1],
  SW: [-1, -1],
  W: [-1, 0],
  NW: [-1, 1],
  UP: [0, 0],
};

/**
 * Can you get from `start` to `end` through `orientation` direction
 *
 * @param {Coords} start
 * @param {Coords} end
 * @param {Orientation} orientation
 * @returns {boolean}
 */
const matchesDirection = (start, end, orientation) => {
  const [startX, startY] = start;
  const [endX, endY] = end;

  const diffX = endX - startX;
  const diffY = endY - startY;

  if (diffX !== 0 && diffY !== 0 && diffX !== diffY) {
    // not a 1:1 diagonal
    return false;
  }
  const [dirX, dirY] = orientationToCoords[orientation];

  return dirX === Math.sign(diffX) && dirY === Math.sign(diffY);
};

const isObstructed = (board, start, end, orientation) => {
  const [startX, startY] = start;
  const [endX, endY] = end;
  const [dirX, dirY] = orientationToCoords[orientation];

  /** @type {Coords[]} */
  let path = [];
  let currentX = startX;
  let currentY = startY;
  while (!(currentX === endX && currentY === endY)) {
    currentX += dirX;
    currentY += dirY;
    path.push([currentX, currentY]);
  }
  path.pop();

  return path.some(([x, y]) => board[x][y].size);
};

const testBoard = range(8).map(() => range(8).map(() => ({})));
testBoard[3][2] = { size: 3, color: "red", orientation: "E" };
//testBoard[6][2] = { size: 2, color: "red", orientation: "UP" };
testBoard[7][2] = { size: 3, color: "blue", orientation: "SW" };
const testState = {
  board: testBoard,
  score: { red: 0, blue: 0 },
  turn: 0,
  currentPlayer: "red",
  startingPlayer: "red",
  finished: false,
};
console.log(JSON.stringify(testState));
console.log(
  JSON.stringify(
    makeMove(testState, {
      start: [3, 2],
      end: [7, 2],
      orientation: "N",
    })
  )
);
