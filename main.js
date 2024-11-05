const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player (Frog) Object
const frog = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 40,
    width: 40,
    height: 40,
    dx: 40,
    dy: 40,
    image: new Image()  // Add an image property for the frog
};
frog.image.src = 'img/frog.png'; // Path to the frog image

// Game Variables
let score = 0;
let highScore = 0;
let frogOnLilyPad = null;
let level = 1;

// Initialize Obstacles, Lily Pads, and Water Lines Arrays
let obstacles = [];
let lilyPads = [];
let waterLines = [];

// Load Images
const lilyPadImage = new Image();
lilyPadImage.src = 'img/log.png';

const carImage = new Image();
carImage.src = 'img/car.png';

// Generate Random Speed between a range
function randomSpeed(min, max) {
    return Math.random() * (max - min) + min;
}

// Generate Random Map Elements with Rules
function generateRandomMap() {
    // Clear current obstacles, lily pads, and water
    obstacles = [];
    lilyPads = [];
    waterLines = [];

    // Update possible water line positions to include more values
    let possibleLines = [40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480];
    let waterPositions = [];

    while (waterPositions.length < 4) {
        const randomLine = possibleLines[Math.floor(Math.random() * possibleLines.length)];
        if (!waterPositions.includes(randomLine)) {
            waterPositions.push(randomLine);
        }
    }
    waterPositions.sort(); // Sort to keep water lines in sequence (easier for logic).

    // Add water lines with lily pads and random speed
    waterPositions.forEach((pos, index) => {
        waterLines.push({ x: 0, y: pos, width: canvas.width, height: 40 });

        let speed = randomSpeed(2, 4);  // Random speed between 1.5 and 3
        let direction = index % 2 === 0 ? 1 : -1;  // Alternate directions

        // Add lily pads with random speed and alternate directions
        lilyPads.push({
            x: Math.random() * (canvas.width - 80),
            y: pos,
            width: 80,
            height: 40,
            image: lilyPadImage,  // Use the image for lily pads
            speed: speed * direction
        });
    });

    // Add obstacles to non-water lines
    possibleLines.forEach(pos => {
        if (!waterPositions.includes(pos)) {
            // Add obstacle to this line (non-water)
            obstacles.push({
                x: Math.random() * (canvas.width - 100),
                y: pos,  // Obstacles placed on these lines
                width: 72,
                height: 40,
                image: carImage,  // Use the image for obstacles
                speed: (Math.random() < 0.5 ? -1 : 1) * randomSpeed(3, 5)
            });
        }
    });
}

// Draw the Canvas Background with Repeating Grass Texture
function drawCanvas() {
    const grassImage = new Image();
    grassImage.src = 'img/road.png';

    // Draw the grass texture repeatedly across the canvas
    const imageWidth = 64;  // Width of the grass image
    const imageHeight = 64; // Height of the grass image

    // Ensure image is loaded before drawing
    grassImage.onload = function () {
        for (let x = 0; x < canvas.width; x += imageWidth) {
            for (let y = 0; y < canvas.height; y += imageHeight) {
                ctx.drawImage(grassImage, x, y, imageWidth, imageHeight);
            }
        }
    };
}

// Draw the Water with Repeating Water Texture
function drawWater() {
    const waterImage = new Image();
    waterImage.src = 'img/water.png';

    // Draw the water texture repeatedly across each water line
    const imageWidth = 64;  // Width of the water image
    const imageHeight = 40; // Height of the water image (adjust as needed)

    // Ensure image is loaded before drawing
    waterImage.onload = function () {
        waterLines.forEach(waterLine => {
            for (let x = waterLine.x; x < waterLine.x + waterLine.width; x += imageWidth) {
                ctx.drawImage(waterImage, x, waterLine.y, imageWidth, imageHeight);
            }
        });
    };
}

// Draw the Frog
function drawFrog() {
    ctx.drawImage(frog.image, frog.x, frog.y, frog.width, frog.height);
}

// Draw Obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save(); // Save the current canvas state
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.scale(obstacle.speed > 0 ? 1 : -1, 1); // Flip image horizontally if moving left
        ctx.drawImage(obstacle.image, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
        ctx.restore(); // Restore the canvas state
    });
}

// Draw Lily Pads
function drawLilyPads() {
    lilyPads.forEach(lilyPad => {
        ctx.drawImage(lilyPad.image, lilyPad.x, lilyPad.y, lilyPad.width, lilyPad.height);
    });
}

// Move the Obstacles
function moveObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x += obstacle.speed;
        if (obstacle.x + obstacle.width < 0 || obstacle.x > canvas.width) {
            obstacle.speed *= -1; // Change direction when hitting canvas edge
        }
    });
}

// Move the Lily Pads
function moveLilyPads() {
    lilyPads.forEach(lilyPad => {
        lilyPad.x += lilyPad.speed;

        // Wrap around the canvas horizontally
        if (lilyPad.x + lilyPad.width < 0) {
            lilyPad.x = canvas.width;
        } else if (lilyPad.x > canvas.width) {
            lilyPad.x = -lilyPad.width;
        }
    });
}

// Check if the Frog is in Water
function isFrogInWater(frog) {
    return waterLines.some(waterLine =>
        frog.x < waterLine.x + waterLine.width &&
        frog.x + frog.width > waterLine.x &&
        frog.y < waterLine.y + waterLine.height &&
        frog.y + frog.height > waterLine.y
    );
}

// Check Water and Lily Pad Interaction
function checkWater() {
    if (isFrogInWater(frog)) {
        let onLilyPad = false;

        lilyPads.forEach(lilyPad => {
            if (
                frog.x < lilyPad.x + lilyPad.width &&
                frog.x + frog.width > lilyPad.x &&
                frog.y < lilyPad.y + lilyPad.height &&
                frog.y + frog.height > lilyPad.y
            ) {
                onLilyPad = true;
                frogOnLilyPad = lilyPad;
            }
        });

        if (!onLilyPad) {
            alert('Game Over! The frog drowned.');
            resetGame();
        }
    } else {
        frogOnLilyPad = null;
    }
}

// Check for Collisions with Obstacles
function checkCollisions() {
    obstacles.forEach(obstacle => {
        if (frog.x < obstacle.x + obstacle.width &&
            frog.x + frog.width > obstacle.x &&
            frog.y < obstacle.y + obstacle.height &&
            frog.y + frog.height > obstacle.y) {
            alert('Game Over! Try Again');
            resetGame();
        }
    });
}

// Check if the Frog is Off the Canvas
function checkFrogOutOfCanvas() {
    if (frog.x < 0 || frog.x + frog.width > canvas.width || frog.y < 0 || frog.y + frog.height > canvas.height) {
        alert('Game Over! The frog went off the canvas.');
        resetGame();
    }
}

// Check Win Condition and Generate New Level
function checkWin() {
    if (frog.y <= 0) {
        score += 1; // Increment score when frog reaches the top
        highScore = Math.max(highScore, score); // Update high score
        level += 1; // Increase the level (difficulty)

        // Generate a new random map
        generateRandomMap();
        resetFrogPosition();
    }
}

// Reset Frog's Position After Win
function resetFrogPosition() {
    frog.x = canvas.width / 2 - 25;
    frog.y = canvas.height - 40;
    frogOnLilyPad = null;
}

// Reset Game State
function resetGame() {
    score = 0;
    level = 1;
    generateRandomMap(); // Reset the map
    resetFrogPosition(); // Reset frog position
}

// Display Score and High Score
function displayScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 50);
}

// Update the Canvas
function updateCanvas() {
    drawCanvas();  // Draw the background first
    drawWater();   // Draw the water next
    drawLilyPads(); // Draw lily pads above the water
    drawObstacles(); // Draw obstacles above lily pads
    drawFrog();    // Draw the frog above everything else
    displayScore(); // Display score and high score
}

// Move the Frog
document.addEventListener('keydown', function (event) {
    if (event.key === 'a' && frog.x > 0) {
        frog.x -= frog.dx;
    } else if (event.key === 'd' && frog.x + frog.width < canvas.width) {
        frog.x += frog.dx;
    } else if (event.key === 'w' && frog.y > 0) {
        frog.y -= frog.dy;
    } else if (event.key === 's' && frog.y + frog.height < canvas.height) {
        frog.y += frog.dy;
    }
    updateCanvas();
});

// Main Game Loop
function gameLoop() {
    moveObstacles();
    moveLilyPads();

    if (frogOnLilyPad) {
        frog.x += frogOnLilyPad.speed; // Frog moves with the lily pad
    }

    checkCollisions();
    checkWater();
    checkWin();
    checkFrogOutOfCanvas();
    updateCanvas();

    requestAnimationFrame(gameLoop);
}

// Initialize Game
generateRandomMap(); // Start with the first random map
gameLoop(); // Start the game loop
