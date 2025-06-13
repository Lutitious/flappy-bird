const gameContainer = document.getElementById('gameContainer');

const bird = document.getElementById('bird');

const pipeContainer = document.getElementById('pipeContainer');

const scoreDisplay = document.getElementById('score');

const startBtn = document.getElementById('startBtn');

const base = document.createElement('div');
base.id = 'base';
gameContainer.appendChild(base);

const gameOverOverlay = document.createElement('div');
gameOverOverlay.id = 'gameOverOverlay';
gameOverOverlay.style.position = 'absolute';
gameOverOverlay.style.left = '50%';
gameOverOverlay.style.top = '50%';
gameOverOverlay.style.transform = 'translate(-50%, -50%)';
gameOverOverlay.style.width = '192px';
gameOverOverlay.style.height = '42px';
gameOverOverlay.style.display = 'none';
gameOverOverlay.style.zIndex = '20';

const gameOverImg = document.createElement('img');
gameOverImg.src = 'assets/gameover.png';
gameOverImg.alt = 'Game Over';
gameOverImg.style.width = '100%';
gameOverImg.style.height = '100%';
gameOverOverlay.appendChild(gameOverImg);
gameContainer.appendChild(gameOverOverlay);

const birdFrameSets = {
    blue: [
        'assets/bluebird-upflap.png',
        'assets/bluebird-midflap.png',
        'assets/bluebird-downflap.png'
    ],
    yellow: [
        'assets/yellowbird-upflap.png',
        'assets/yellowbird-midflap.png',
        'assets/yellowbird-downflap.png'
    ],
    red: [
        'assets/redbird-upflap.png',
        'assets/redbird-midflap.png',
        'assets/redbird-downflap.png'
    ]
};

let currentBirdSkin = 'yellow';

let birdFrames = birdFrameSets[currentBirdSkin];

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;

const PIPE_WIDTH = 52;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;

const GRAVITY = 0.5;
const JUMP = -8;

let birdFrameIndex = 0;
let birdFrameTick = 0;

let currentBg = 'day';
let currentPipe = 'green';

let bgOffset = 0;
let bsOffset = 0;
const BG_SCROLL_SPEED = 0.5;

function playSound(src) {
    const audio = new Audio(src);
    audio.play();
}

let isGameRunning = false;
let isGameOver = false;
let gameoverImg = null;
let awaitingReset = false;

function setBirdImage() {
    bird.style.background = `url('${birdFrames[birdFrameIndex]}') center/contain no-repeat`;
    bird.style.width = BIRD_WIDTH + 'px';
    bird.style.height = BIRD_HEIGHT + 'px';
    let maxAngle = 90;
    let minAngle = -25;
    let angle = Math.max(minAngle, Math.min(maxAngle, birdVelocity * 3));
    bird.style.transform = `rotate(${angle}deg)`;
}

function animateBird() {
    birdFrameTick++;
    if (birdFrameTick % 6 === 0) {
        birdFrameIndex = (birdFrameIndex + 1) % birdFrames.length;
    }
    setBirdImage();
}

function setBirdSkin(skin) {
    if (!birdFrameSets[skin]) return;
    currentBirdSkin = skin;
    birdFrames = birdFrameSets[skin];
    birdFrameIndex = 0;
    setBirdImage();
    document.querySelectorAll('.bird-skin-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.skin === skin);
    });
}

function setBackground(bg) {
    currentBg = bg;
    const bgFile = bg === 'night' ? 'background-night.png' : 'background-day.png';
    gameContainer.style.backgroundImage = `url('assets/${bgFile}')`;
    gameContainer.style.backgroundRepeat = 'repeat-x';
    gameContainer.style.backgroundPositionX = `${-bgOffset}px`;
    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.bg === bg);
    });
    if (bg === 'night') {
        document.body.classList.add('dark');
        gameContainer.classList.add('dark');
        scoreDisplay.classList.add('dark');
        startBtn.classList.add('dark');
        document.querySelectorAll('.bird-skin-btn, .bg-btn, .pipe-btn').forEach(btn => btn.classList.add('dark'));
    } else {
        document.body.classList.remove('dark');
        gameContainer.classList.remove('dark');
        scoreDisplay.classList.remove('dark');
        startBtn.classList.remove('dark');
        document.querySelectorAll('.bird-skin-btn, .bg-btn, .pipe-btn').forEach(btn => btn.classList.remove('dark'));
    }
}

function setPipeColor(color) {
    currentPipe = color;
    document.querySelectorAll('.pipe-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.pipe === color);
    });
}

let birdY = 250;
let birdVelocity = 0;
let pipes = [];
let score = 0;
let gameInterval = null;

function updateScoreDisplay() {
    scoreDisplay.innerHTML = '';
    const scoreStr = score.toString();
    for (let i = 0; i < scoreStr.length; i++) {
        const digit = scoreStr[i];
        const img = document.createElement('img');
        img.src = `assets/${digit}.png`;
        img.alt = digit;
        img.style.height = '40px';
        img.style.width = 'auto';
        img.style.verticalAlign = 'middle';
        img.className = 'score-digit';
        scoreDisplay.appendChild(img);
    }
}

function getPipeGapRange() {
    const minPipeHeight = Math.floor(GAME_HEIGHT * 0.22);
    const baseHeight = 112;
    const minGapY = minPipeHeight;
    const maxGapY = GAME_HEIGHT - PIPE_GAP - minPipeHeight - baseHeight;
    return { minGapY, maxGapY, minPipeHeight, baseHeight };
}

function createPipe() {
    const { minGapY, maxGapY, baseHeight } = getPipeGapRange();
    let gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
    const topPipeHeight = gapY;
    const bottomPipeHeight = GAME_HEIGHT - gapY - PIPE_GAP - baseHeight;
    if (pipes.length > 0) {
        const lastPipe = pipes[pipes.length - 1];
        if (lastPipe.x > GAME_WIDTH - 220) {
            return;
        }
    }
    const pipeFile = currentPipe === 'red' ? 'pipe-red.png' : 'pipe-green.png';
    const pipeFile180 = currentPipe === 'red' ? 'pipe-red-180.png' : 'pipe-green-180.png';
    const topPipe = document.createElement('div');
    topPipe.className = 'pipe';
    topPipe.style.height = topPipeHeight + 'px';
    topPipe.style.width = PIPE_WIDTH + 'px';
    topPipe.style.left = GAME_WIDTH + 'px';
    topPipe.style.top = '0px';
    topPipe.style.background = `url('assets/${pipeFile180}') left bottom repeat-y`;
    topPipe.style.backgroundSize = `100% auto`;
    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe';
    bottomPipe.style.height = bottomPipeHeight + 'px';
    bottomPipe.style.width = PIPE_WIDTH + 'px';
    bottomPipe.style.left = GAME_WIDTH + 'px';
    bottomPipe.style.top = (gapY + PIPE_GAP) + 'px';
    bottomPipe.style.background = `url('assets/${pipeFile}') left top repeat-y`;
    bottomPipe.style.backgroundSize = `100% auto`;
    pipeContainer.appendChild(topPipe);
    pipeContainer.appendChild(bottomPipe);
    pipes.push({ top: topPipe, bottom: bottomPipe, x: GAME_WIDTH, passed: false });
}

function resetGame(animate = true, resetParallax = true) {
    const {baseHeight} = getPipeGapRange();
    birdY = Math.floor((GAME_HEIGHT - baseHeight - BIRD_HEIGHT) / 2);
    birdVelocity = 0;
    pipes = [];
    score = 0;
    if (resetParallax) bgOffset = 0;
    updateScoreDisplay();
    bird.style.top = birdY + 'px';
    pipeContainer.innerHTML = '';
    birdFrameIndex = 0;
    birdFrameTick = 0;
    setBirdSkin(currentBirdSkin, animate);
    setBackground(currentBg, animate);
    setPipeColor(currentPipe, animate);
    setBirdImage();
    positionBase();
    isGameOver = false;
    if (gameoverImg) {
        gameContainer.removeChild(gameoverImg);
        gameoverImg = null;
    }
}

function startGame() {
    resetGame(false, false);
    isGameRunning = true;
    awaitingReset = false;
    startBtn.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    document.addEventListener('keydown', handleJump);
    gameContainer.addEventListener('mousedown', handleJump);
    gameInterval = setInterval(gameLoop, 1000 / 60);
    playSound('audio/swoosh.wav');
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    startBtn.style.display = 'none';
    gameOverOverlay.style.display = 'block';
    document.removeEventListener('keydown', handleJump);
    gameContainer.removeEventListener('mousedown', handleJump);
    playSound('audio/hit.wav');
    awaitingReset = true;
}

function handleJump(e) {
    if ((e.code === 'Space' || e.key === ' ') || e.type === 'mousedown') {
        if (!isGameRunning && !isGameOver) {
            startGame();
            return;
        }
        if (isGameRunning) {
            birdVelocity = JUMP;
            setBirdImage();
            playSound('audio/wing.wav');
        }
    }
}

function handleReset(e) {
    if (!awaitingReset) return;
    if ((e.code === 'Space' || e.key === ' ') || e.type === 'mousedown') {
        awaitingReset = false;
        gameOverOverlay.style.display = 'none';
        isGameRunning = false;
        isGameOver = false;
        clearInterval(gameInterval);
        resetGame(true, true);
        startBtn.style.display = 'block';
        document.removeEventListener('keydown', handleJump);
        gameContainer.removeEventListener('mousedown', handleJump);
    }
}

function positionBase() {
    base.style.position = 'absolute';
    base.style.left = '0';
    base.style.width = '100%';
    base.style.height = '112px';
    base.style.bottom = '0';
    base.style.background = "url('assets/base.png') repeat-x bottom left";
    base.style.backgroundSize = 'auto 112px';
    base.style.zIndex = '5';
}

positionBase();
window.addEventListener('resize', positionBase);

function scrollBackground() {
    bgOffset += BG_SCROLL_SPEED;
    bsOffset += PIPE_SPEED;
    gameContainer.style.backgroundPositionX = `${-bgOffset}px`;
    base.style.backgroundPositionX = `${-bsOffset}px`;
}

let lastFrameTime = 0;
const FRAME_DURATION = 1000 / 60;

function backgroundLoop(now) {
    if (!lastFrameTime) lastFrameTime = now;
    const delta = now - lastFrameTime;
    if (delta >= FRAME_DURATION) {
        if (!awaitingReset) {
            scrollBackground();
        }
        lastFrameTime = now;
    }
    requestAnimationFrame(backgroundLoop);
}

requestAnimationFrame(backgroundLoop);

function gameLoop() {
    birdVelocity += GRAVITY;
    birdY += birdVelocity;
    if (birdY < 0) birdY = 0;
    bird.style.top = birdY + 'px';
    animateBird();
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        pipes[i].top.style.left = pipes[i].x + 'px';
        pipes[i].bottom.style.left = pipes[i].x + 'px';
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipeContainer.removeChild(pipes[i].top);
            pipeContainer.removeChild(pipes[i].bottom);
            pipes.splice(i, 1);
        }
        else if (!pipes[i].passed && (pipes[i].x + PIPE_WIDTH / 2) < (60 + BIRD_WIDTH / 2)) {
            pipes[i].passed = true;
            score++;
            updateScoreDisplay();
            playSound('audio/point.wav');
        }
        if (isColliding(pipes[i])) {
            endGame();
        }
    }
    if (pipes.length === 0 || pipes[pipes.length - 1].x < GAME_WIDTH - 220) {
        createPipe();
    }
    const baseTop = GAME_HEIGHT - 112;
    if (birdY + BIRD_HEIGHT > baseTop) {
        endGame();
    }
}

function isColliding(pipe) {
    const birdRect = {
        left: 60,
        right: 60 + BIRD_WIDTH,
        top: birdY,
        bottom: birdY + BIRD_HEIGHT
    };
    const topRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: 0,
        bottom: pipe.top.offsetHeight
    };
    const bottomRect = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: pipe.bottom.offsetTop,
        bottom: GAME_HEIGHT
    };
    return (
        rectsOverlap(birdRect, topRect) || rectsOverlap(birdRect, bottomRect)
    );
}

function rectsOverlap(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

startBtn.innerHTML = '';
startBtn.style.background = 'none';
startBtn.style.border = 'none';
startBtn.style.padding = '0';
startBtn.style.width = '184px';
startBtn.style.height = '267px';
startBtn.style.position = 'absolute';
startBtn.style.left = '50%';
startBtn.style.top = '50%';
startBtn.style.transform = 'translate(-50%, -50%)';
startBtn.style.boxShadow = 'none';

const msgImg = document.createElement('img');
msgImg.src = 'assets/message.png';
msgImg.alt = 'Start Game';
msgImg.style.width = '100%';
msgImg.style.height = '100%';
msgImg.style.display = 'block';

startBtn.appendChild(msgImg);
startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', function(e) {
    if (!isGameRunning && !awaitingReset && (e.code === 'Space' || e.key === ' ')) {
        startGame();
    }
});

gameContainer.addEventListener('mousedown', function(e) {
    if (!isGameRunning && !awaitingReset) {
        startGame();
    }
});

document.addEventListener('keydown', handleReset);
gameContainer.addEventListener('mousedown', handleReset);

document.addEventListener('DOMContentLoaded', function() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        setBackground('night');
    } else {
        setBackground('day');
    }
    setBirdSkin('yellow');
    setPipeColor('green');
    birdY = Math.floor((GAME_HEIGHT - 112 - BIRD_HEIGHT) / 2);
    birdVelocity = 0;
    pipes = [];
    score = 0;
    bgOffset = 0;
    updateScoreDisplay();
    bird.style.top = birdY + 'px';
    pipeContainer.innerHTML = '';
    birdFrameIndex = 0;
    birdFrameTick = 0;
    setBirdImage();
    positionBase();
    isGameOver = false;
    if (gameoverImg) {
        gameContainer.removeChild(gameoverImg);
        gameoverImg = null;
    }
    document.querySelectorAll('.bird-skin-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setBirdSkin(btn.dataset.skin);
        });
    });
    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setBackground(btn.dataset.bg);
        });
    });
    document.querySelectorAll('.pipe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setPipeColor(btn.dataset.pipe);
        });
    });
});
