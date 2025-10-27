import * as Tone from "tone";
import { _database } from "./codes.js";

const synth = new Tone.Synth().toDestination();
const gainNode = new Tone.Gain(0.1).toDestination();
synth.connect(gainNode);

function playSound(command) {
  let note;
  switch (command) {
    case ">":
      note = "C2";
      break;
    case "<":
      note = "C3";
      break;
    case "+":
      note = "C4";
      break;
    case "-":
      note = "C5";
      break;
    case ".":
      note = "C6";
      break;
    case "[":
      note = "C7";
      break;
    case "]":
      note = "C8";
      break;
    default:
      return;
  }
  synth.triggerAttackRelease(note, "8n");

  // Modify gain for each command
  gainNode.gain.value += 0.1;

  if (gainNode.gain.value > 1) {
    gainNode.gain.value = 0.1;
  }
}

let self_database = _database;
let memory = new Array(10).fill(0);
let pointer = 0;

// Access parent mouseless URL parameters
let mainRoute;
try {
  mainRoute = window.parent.location.search;
} catch (e) {
  mainRoute = window.location.search;
}

let id = new URLSearchParams(mainRoute).get('id') || '0';
let code = self_database.list.find((item) => item.id.toString() === id)
if (!code) {
  code = self_database.list.find((item) => item.id === 999); // Not Found
}
code = code.source;
let codeIndex = 0;
let output = "";
let running = false;
let interval;
let speed = 100;
const decoder = new TextDecoder("utf-8");

const memoryDiv = document.getElementById("memory");
const codeDiv = document.getElementById("code");
const outputDiv = document.getElementById("output");

// Initialize memory display
function updateMemory() {
  memoryDiv.innerHTML = "";
  for (let i = 0; i < memory.length; i++) {
    const cell = document.createElement("div");
    cell.classList.add("memory-cell");
    if (i === pointer) {
      cell.classList.add("highlight");
    }
    cell.textContent = memory[i];
    memoryDiv.appendChild(cell);
  }
}

// Highlight and indent code with color
function updateCodeDisplay() {
  let _code = code;
  const before = _code
    .slice(0, codeIndex)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const current = _code[codeIndex].replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const after = _code
    .slice(codeIndex + 1)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  codeDiv.innerHTML = `${before}<span class="current">${current}</span>${after}`;
}

// Brainfuck interpreter logic
function brainfuckStep() {
  if (codeIndex >= code.length) {
    running = false;
    clearInterval(interval);
    return;
  }

  const command = code[codeIndex];
  const commandFunctions = {
    ">": () => (pointer = (pointer + 1) % memory.length),
    "<": () => (pointer = (pointer - 1 + memory.length) % memory.length),
    "+": () => (memory[pointer] = (memory[pointer] + 1) % 256),
    "-": () => (memory[pointer] = (memory[pointer] - 1 + 256) % 256),
    ".": () => (output += decoder.decode(new Uint8Array([memory[pointer]]))),
    "[": handleLoopStart,
    "]": handleLoopEnd,
  };

  if (commandFunctions[command]) {
    commandFunctions[command]();
  }

  updateMemory();
  updateCodeDisplay();
  outputDiv.textContent = output || "";
  playSound(command);
  codeIndex++;
}

function handleLoopStart() {
  if (memory[pointer] === 0) {
    let loops = 1;
    while (loops > 0) {
      codeIndex++;
      if (code[codeIndex] === "[") loops++;
      else if (code[codeIndex] === "]") loops--;
    }
  }
}

function handleLoopEnd() {
  if (memory[pointer] !== 0) {
    let loops = 1;
    while (loops > 0) {
      codeIndex--;
      if (code[codeIndex] === "[") loops--;
      else if (code[codeIndex] === "]") loops++;
    }
  }
}

document.getElementById("run").onclick = () => {
  if (!running) {
    running = true;
    interval = setInterval(brainfuckStep, speed);
  }
};

document.getElementById("pause").onclick = () => {
  running = false;
  clearInterval(interval);
};

document.getElementById("step").onclick = () => {
  if (!running) {
    brainfuckStep();
  }
};

document.getElementById("continue").onclick = () => {
  if (!running) {
    running = true;
    interval = setInterval(brainfuckStep, speed);
  }
};

updateMemory();
updateCodeDisplay();
