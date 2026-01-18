const gridEl = document.getElementById('grid');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('reset-btn');
const moveCountEl = document.getElementById('move-count');
const winMessageEl = document.getElementById('win-message');

let size = 5;
let moves = 0;
let grid = [];

function init() {
    difficultySelect.addEventListener('change', (e) => {
        size = parseInt(e.target.value);
        initGame();
    });
    resetBtn.addEventListener('click', initGame);
    initGame();
}

function initGame() {
    moves = 0;
    updateStats();
    winMessageEl.classList.add('hidden');

    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.innerHTML = '';
    grid = [];

    for (let r = 0; r < size; r++) {
        let row = [];
        for (let c = 0; c < size; c++) {
            row.push(false);
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('click', () => handleMove(r, c));
            gridEl.appendChild(cell);
        }
        grid.push(row);
    }

    randomize();
}

function randomize() {
    const shuffleMoves = size * 5;
    for (let i = 0; i < shuffleMoves; i++) {
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);
        toggle(r, c);
    }
    moves = 0;
    updateStats();
}

function handleMove(r, c) {
    toggle(r, c);
    toggle(r - 1, c);
    toggle(r + 1, c);
    toggle(r, c - 1);
    toggle(r, c + 1);

    moves++;
    updateStats();
    checkWin();
}

function toggle(r, c) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
        grid[r][c] = !grid[r][c];
        const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (grid[r][c]) {
            cell.classList.add('is-on');
        } else {
            cell.classList.remove('is-on');
        }
    }
}

function updateStats() {
    moveCountEl.textContent = moves;
}

function checkWin() {
    if (moves === 0) return;

    let allOff = true;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c]) {
                allOff = false;
                break;
            }
        }
    }

    if (allOff) {
        winMessageEl.classList.remove('hidden');
    }
}

init();
