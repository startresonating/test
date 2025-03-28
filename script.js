document.addEventListener('DOMContentLoaded', () => {
    const game = document.getElementById('game');
    const spaceship = document.getElementById('spaceship');
    const scoreDisplay = document.getElementById('score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    
    // Game variables
    let gameRunning = false;
    let score = 0;
    let spaceshipPosition = 50;
    let spaceshipVelocity = 0;
    let gravity = 0.5;
    let lasers = [];
    let lastLaserTime = 0;
    let gameSpeed = 2;
    let gwionMessageActive = false;
    
    // Gwion update - random messages
    const gwionMessages = [
        "GET IN THERE GWION!",
        "HELL YEAH GWION!",
        "HANG LOOSE HANG LOOSE",
        "LET'S GOOOO!",
        "GWION ON FIRE!",
        "SMASHING IT GWION!",
        "ABSOLUTELY CRUSHING IT!",
        "GWION = GOAT!",
        "SICK MOVES GWION!",
        "UNSTOPPABLE GWION!",
        "LEGENDARY GWION!",
        "GWION TAKING FLIGHT!",
        "HORNY!", // Added new phrases
        "SO HORNY",
        "TITTY ASS!"
    ];
    
    // Game constants
    const JUMP_STRENGTH = -8;
    const LASER_INTERVAL = 1650; // Increased by 10% from 1500
    const GAME_WIDTH = game.clientWidth;
    const GAME_HEIGHT = game.clientHeight;
    const SPACESHIP_WIDTH = 50; // Changed to make the spaceship (boob) a circle
    const SPACESHIP_HEIGHT = 50; // Changed to make the spaceship (boob) a circle
    const LASER_WIDTH = 40;
    const GAP_SIZE = 172.5; // Increased by 15% from 150
    
    // Initial spaceship position
    spaceship.style.left = '100px';
    spaceship.style.top = spaceshipPosition + 'px';
    
    // Input handlers
    document.addEventListener('keydown', handleInput);
    game.addEventListener('click', handleInput);
    game.addEventListener('touchstart', handleInput);
    
    function handleInput(e) {
        if (e.code === 'Space' || e.type === 'click' || e.type === 'touchstart') {
            e.preventDefault();
            
            if (!gameRunning) {
                startGame();
            } else {
                // Make spaceship jump
                spaceshipVelocity = JUMP_STRENGTH;
                // Rotate spaceship slightly up
                spaceship.style.transform = 'rotate(-20deg)';
            }
        }
    }
    
    function startGame() {
        // Reset game state
        gameRunning = true;
        score = 0;
        spaceshipPosition = GAME_HEIGHT / 3;
        spaceshipVelocity = 0;
        lasers = [];
        lastLaserTime = Date.now();
        gameSpeed = 2;
        
        // Update UI
        scoreDisplay.textContent = score;
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
    
    function gameLoop(timestamp) {
        if (!gameRunning) return;
        
        // Update spaceship position
        spaceshipVelocity += gravity;
        spaceshipPosition += spaceshipVelocity;
        
        // Gradually return spaceship rotation to normal
        if (spaceshipVelocity > 0) {
            spaceship.style.transform = 'rotate(15deg)';
        }
        
        // Check for collisions with boundaries
        if (spaceshipPosition < 0) {
            spaceshipPosition = 0;
            spaceshipVelocity = 0;
        } else if (spaceshipPosition > GAME_HEIGHT - SPACESHIP_HEIGHT) {
            gameOver();
            return;
        }
        
        // Update spaceship position
        spaceship.style.top = spaceshipPosition + 'px';
        
        // Spawn new lasers
        if (Date.now() - lastLaserTime > LASER_INTERVAL) {
            spawnLaser();
            lastLaserTime = Date.now();
        }
        
        // Move and check lasers
        updateLasers();
        
        // Continue game loop
        requestAnimationFrame(gameLoop);
    }
    
    function spawnLaser() {
        // Create laser element
        const laser = document.createElement('div');
        laser.className = 'laser';
        
        // Randomize gap position
        const gapStart = Math.random() * (GAME_HEIGHT - GAP_SIZE);
        
        // Create top laser beam
        const topBeam = document.createElement('div');
        topBeam.className = 'laser-beam';
        topBeam.style.top = '0';
        topBeam.style.height = gapStart + 'px';
        
        // Create bottom laser beam
        const bottomBeam = document.createElement('div');
        bottomBeam.className = 'laser-beam';
        bottomBeam.style.top = (gapStart + GAP_SIZE) + 'px';
        bottomBeam.style.height = (GAME_HEIGHT - gapStart - GAP_SIZE) + 'px';
        
        // Add beams to laser
        laser.appendChild(topBeam);
        laser.appendChild(bottomBeam);
        
        // Add laser to game
        game.appendChild(laser);
        
        // Add laser to array with tracking info
        lasers.push({
            element: laser,
            passed: false,
            x: GAME_WIDTH
        });
    }
    
    function updateLasers() {
        // Update each laser
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            
            // Move laser
            laser.x -= gameSpeed;
            laser.element.style.right = (GAME_WIDTH - laser.x) + 'px';
            
            // Check if spaceship passed laser
            if (!laser.passed && laser.x < 100) {
                laser.passed = true;
                score++;
                scoreDisplay.textContent = score;
                
                // Show Gwion message every 3 lasers instead of 5
                if (score % 3 === 0) {
                    // Increase game speed by 5% every 3 lasers
                    gameSpeed *= 1.05;
                    
                    // Show message if not already showing one
                    if (!gwionMessageActive) {
                        showGwionMessage();
                    }
                }
            }
            
            // Check for collision
            if (checkCollision(laser)) {
                gameOver();
                return;
            }
            
            // Remove lasers that are off-screen
            if (laser.x < -LASER_WIDTH) {
                game.removeChild(laser.element);
                lasers.splice(i, 1);
            }
        }
    }
    
    function checkCollision(laser) {
        // Circle collision detection for the boob
        const circleRadius = SPACESHIP_WIDTH / 2 * 0.7; // 30% reduced hitbox for the circle
        const circleCenterX = 100 + SPACESHIP_WIDTH / 2;
        const circleCenterY = spaceshipPosition + SPACESHIP_HEIGHT / 2;
        
        // Check if spaceship is within laser x-range
        if (laser.x <= circleCenterX + circleRadius && laser.x + LASER_WIDTH >= circleCenterX - circleRadius) {
            // Get laser gap position
            const laserBeams = laser.element.querySelectorAll('.laser-beam');
            const gapStart = parseFloat(laserBeams[0].style.height);
            const gapEnd = parseFloat(laserBeams[1].style.top);
            
            // Check if spaceship circle intersects with laser beams
            if (circleCenterY - circleRadius < gapStart || circleCenterY + circleRadius > gapEnd) {
                return true; // Collision detected
            }
        }
        
        return false;
    }
    
    // Gwion update - show random message function
    function showGwionMessage() {
        gwionMessageActive = true;
        
        // Select random message
        const randomIndex = Math.floor(Math.random() * gwionMessages.length);
        const message = gwionMessages[randomIndex];
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'gwion-message';
        messageElement.textContent = message;
        game.appendChild(messageElement);
        
        // Remove message after animation completes (2 seconds)
        setTimeout(() => {
            game.removeChild(messageElement);
            gwionMessageActive = false;
        }, 2000);
    }
    
    function gameOver() {
        gameRunning = false;
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
        
        // Remove all lasers
        lasers.forEach(laser => {
            game.removeChild(laser.element);
        });
        lasers = [];
        
        // Remove any active Gwion messages
        const activeMessages = document.querySelectorAll('.gwion-message');
        activeMessages.forEach(el => game.removeChild(el));
        gwionMessageActive = false;
    }
    
    // Adjust canvas size on window resize
    window.addEventListener('resize', () => {
        const GAME_WIDTH = game.clientWidth;
        const GAME_HEIGHT = game.clientHeight;
    });
});