// Game initialization
window.addEventListener('load', function() {
    // Prevent scrolling
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Game constants
    const CANVAS = document.getElementById('game-canvas');
    const CTX = CANVAS.getContext('2d');
    const GRAVITY = 0.2;
    const FRICTION = 0.98;
    const MAX_POWER = 15;
    
    // Game variables
    let width, height;
    let gameState = 'start';
    let selectedDifficulty = 1;
    let currentLevel = 1;
    let score = 0;
    let lives = 3;
    let combo = 0;
    let targetCount = 0;
    let hitsRequired = 0;
    let levelStartTime = 0;
    let animationFrameId = null;
    
    // Game objects
    let player = null;
    let obstacles = [];
    let targets = [];
    let particles = [];
    let powerUps = [];
    
    // Input tracking
    let touchStart = { x: 0, y: 0 };
    let touchEnd = { x: 0, y: 0 };
    let isDragging = false;
    
    // Game effects
    let screenShake = 0;
    let slowMotion = 0;
    
    // Audio effects (preload sounds)
    const sounds = {
        bounce: new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAL6QWwrFAAEgAAAAB+8AAAABBmqqqICL/9RZ30fxoc6P/SDI/0kf0kWEv//8sIxMTExMTEAAAAA'),
        hit: new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAL6QZFj4AAEgAAAAAOAAAAABP/jjBf///yk+yL/Kbqt02KqXfr///xMTExMTExMQ=='),
        powerup: new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAL6QrMhAgAEgAAAAAOAAAAABJkGf/6n/X//8+xz4p9qs0+vaPv//+JiYmJiYmJi'),
        levelComplete: new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAL6QrsoAgAEgAAAAAOAAAAABOobjf6h/+t//1dUKyqsNPVEb///ExMTExMTExM='),
        gameOver: new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAAAAABLBQAAAL6QrZLGAAEgAAAAAOAAAAABIGjWf+WV///xKNh3pCE1wL7///ExMTExMTExM=')
    };
    
    // Mute sounds initially
    let soundsEnabled = true;
    
    function playSFX(sound) {
        if (soundsEnabled) {
            const sfx = sounds[sound];
            if (sfx) {
                sfx.currentTime = 0;
                sfx.play().catch(error => console.log("Audio play error:", error));
            }
        }
    }
    
    // Set up canvas and game area
    function setupCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        CANVAS.width = width;
        CANVAS.height = height;
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        setupCanvas();
        if (player) player.resetPosition();
    });
    
    // UI Element Selectors
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const levelCompleteScreen = document.getElementById('level-complete-screen');
    const pauseScreen = document.getElementById('pause-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const menuButtonGameover = document.getElementById('menu-button-gameover');
    const menuButtonPause = document.getElementById('menu-button-pause');
    const nextLevelButton = document.getElementById('next-level-button');
    const resumeButton = document.getElementById('resume-button');
    const pauseButton = document.getElementById('pause-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const finalScore = document.getElementById('final-score');
    const finalLevel = document.getElementById('final-level');
    const levelScore = document.getElementById('level-score');
    const levelTime = document.getElementById('level-time');
    const levelBonus = document.getElementById('level-bonus');
    const progressBar = document.getElementById('progress-bar');
    const livesContainer = document.getElementById('lives-container');
    const levelIndicator = document.getElementById('level-indicator');
    const comboIndicator = document.getElementById('combo-indicator');
    const powerUpIndicator = document.getElementById('power-up-indicator');
    
    // Game UI handling
    function showScreen(screen) {
        startScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        levelCompleteScreen.classList.remove('active');
        pauseScreen.classList.remove('active');
        
        if (screen === 'start') {
            startScreen.classList.add('active');
        } else if (screen === 'game-over') {
            gameOverScreen.classList.add('active');
        } else if (screen === 'level-complete') {
            levelCompleteScreen.classList.add('active');
        } else if (screen === 'pause') {
            pauseScreen.classList.add('active');
        }
    }
    
    // Event Listeners for UI
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    menuButtonGameover.addEventListener('click', goToMainMenu);
    menuButtonPause.addEventListener('click', goToMainMenu);
    nextLevelButton.addEventListener('click', startNextLevel);
    resumeButton.addEventListener('click', resumeGame);
    pauseButton.addEventListener('click', pauseGame);
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            selectedDifficulty = parseInt(this.getAttribute('data-difficulty'));
        });
    });
    
    // Touch and mouse event handlers
    CANVAS.addEventListener('mousedown', handleDragStart);
    CANVAS.addEventListener('mousemove', handleDragMove);
    CANVAS.addEventListener('mouseup', handleDragEnd);
    CANVAS.addEventListener('touchstart', handleTouchStart);
    CANVAS.addEventListener('touchmove', handleTouchMove);
    CANVAS.addEventListener('touchend', handleTouchEnd);
    
    function handleDragStart(e) {
        if (gameState !== 'playing' || !player.canLaunch) return;
        isDragging = true;
        touchStart.x = e.clientX || e.touches[0].clientX;
        touchStart.y = e.clientY || e.touches[0].clientY;
        touchEnd.x = touchStart.x;
        touchEnd.y = touchStart.y;
    }
    
    function handleDragMove(e) {
        if (!isDragging) return;
        touchEnd.x = e.clientX || e.touches[0].clientX;
        touchEnd.y = e.clientY || e.touches[0].clientY;
    }
    
    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        // Calculate direction and power
        const dx = touchStart.x - touchEnd.x;
        const dy = touchStart.y - touchEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance / 10, MAX_POWER);
        
        // Launch player
        if (power > 1 && player.canLaunch) {
            player.vx = dx / 10 * (0.7 + 0.3 * selectedDifficulty);
            player.vy = dy / 10 * (0.7 + 0.3 * selectedDifficulty);
            player.canLaunch = false;
            player.isLaunched = true;
            
            // Play launch sound
            playSFX('bounce');
            
            // Add launch particles
            createParticles(player.x, player.y, 15, player.color, 2, 30);
        }
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        handleDragStart(e.touches[0]);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        handleDragMove(e.touches[0]);
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        handleDragEnd();
    }
    
    // Game state functions
    function startGame() {
        gameState = 'playing';
        currentLevel = 1;
        score = 0;
        lives = 3;
        updateLivesDisplay();
        resetLevel();
        showScreen();
        levelStartTime = Date.now();
        
        // Show level indicator
        levelIndicator.textContent = `LEVEL ${currentLevel}`;
        levelIndicator.classList.add('visible');
        setTimeout(() => {
            levelIndicator.classList.remove('visible');
        }, 2000);
        
        // Start game loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }
    
    function restartGame() {
        gameState = 'playing';
        currentLevel = 1;
        score = 0;
        lives = 3;
        updateLivesDisplay();
        resetLevel();
        showScreen();
        levelStartTime = Date.now();
        
        // Show level indicator
        levelIndicator.textContent = `LEVEL ${currentLevel}`;
        levelIndicator.classList.add('visible');
        setTimeout(() => {
            levelIndicator.classList.remove('visible');
        }, 2000);
        
        // Start game loop if not already running
        if (!animationFrameId) {
            gameLoop();
        }
    }
    
    function goToMainMenu() {
        gameState = 'start';
        showScreen('start');
    }
    
    function startNextLevel() {
        currentLevel++;
        resetLevel();
        showScreen();
        gameState = 'playing';
        levelStartTime = Date.now();
        
        // Show level indicator
        levelIndicator.textContent = `LEVEL ${currentLevel}`;
        levelIndicator.classList.add('visible');
        setTimeout(() => {
            levelIndicator.classList.remove('visible');
        }, 2000);
    }
    
    function pauseGame() {
        if (gameState === 'playing') {
            gameState = 'paused';
            showScreen('pause');
        }
    }
    
    function resumeGame() {
        if (gameState === 'paused') {
            gameState = 'playing';
            showScreen();
        }
    }
    
    function gameOver() {
        gameState = 'gameOver';
        finalScore.textContent = `Score: ${score}`;
        finalLevel.textContent = `Level: ${currentLevel}`;
        showScreen('game-over');
        playSFX('gameOver');
    }
    
    function levelComplete() {
        gameState = 'levelComplete';
        const levelDuration = Math.floor((Date.now() - levelStartTime) / 1000);
        
        // Bonus score for completing level
        const timeBonus = Math.max(100 - levelDuration, 0) * 10 * currentLevel;
        score += timeBonus;
        updateScore();
        
        levelScore.textContent = `Score: ${score}`;
        levelTime.textContent = `Time: ${levelDuration}s`;
        levelBonus.textContent = `Bonus: +${timeBonus}`;
        showScreen('level-complete');
        playSFX('levelComplete');
    }
    
    function resetLevel() {
        // Clear all game objects
        obstacles = [];
        targets = [];
        particles = [];
        powerUps = [];
        
        // Reset player
        player = new Player();
        
        // Generate level based on current level and difficulty
        generateLevel(currentLevel, selectedDifficulty);
        
        // Reset UI
        updateScore();
        updateLevelDisplay();
        combo = 0;
        
        // Update progress bar
        updateProgressBar();
    }
    
    // Update UI functions
    function updateScore() {
        scoreDisplay.textContent = score;
        
        // Add a little animation
        scoreDisplay.classList.add('highlight');
        setTimeout(() => {
            scoreDisplay.classList.remove('highlight');
        }, 300);
    }
    
    function updateLevelDisplay() {
        levelDisplay.textContent = currentLevel;
    }
    
    function updateLivesDisplay() {
        livesContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const lifeElement = document.createElement('div');
            lifeElement.className = 'life';
            if (i >= lives) {
                lifeElement.classList.add('lost');
            }
            livesContainer.appendChild(lifeElement);
        }
    }
    
    function updateProgressBar() {
        const progress = (targetCount - hitsRequired) / targetCount * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    function showCombo(comboCount) {
        comboIndicator.textContent = `COMBO x${comboCount}!`;
        comboIndicator.className = '';
        void comboIndicator.offsetWidth; // Trigger reflow
        comboIndicator.classList.add('pop-in');
    }
    
    function showPowerUpIndicator(type) {
        let text = '';
        switch (type) {
            case 'multiball':
                text = 'MULTIBALL!';
                break;
            case 'slowmo':
                text = 'SLOW MOTION!';
                break;
            case 'extralife':
                text = '+1 LIFE!';
                break;
        }
        
        powerUpIndicator.textContent = text;
        powerUpIndicator.classList.add('visible');
        
        setTimeout(() => {
            powerUpIndicator.classList.remove('visible');
        }, 2000);
    }
    
    // Game objects classes
    class Player {
        constructor() {
            this.radius = 15;
            this.resetPosition();
            this.vx = 0;
            this.vy = 0;
            this.canLaunch = true;
            this.isLaunched = false;
            this.color = '#FF3EA5';
            this.trailTimer = 0;
            this.powerUp = null;
            this.powerUpTimer = 0;
        }
        
        resetPosition() {
            this.x = width / 2;
            this.y = height - 100;
            this.vx = 0;
            this.vy = 0;
            this.canLaunch = true;
            this.isLaunched = false;
        }
        
        update() {
            // Apply power-up effects
            if (this.powerUp) {
                this.powerUpTimer--;
                if (this.powerUpTimer <= 0) {
                    this.powerUp = null;
                }
            }
            
            // Add trail particles
            this.trailTimer++;
            if (this.isLaunched && this.trailTimer >= 3) {
                this.trailTimer = 0;
                createParticles(this.x, this.y, 1, this.color, 1, 10);
            }
            
            // Apply physics if launched
            if (this.isLaunched) {
                // Apply gravity and friction
                this.vy += GRAVITY * (slowMotion > 0 ? 0.3 : 1);
                this.vx *= FRICTION;
                this.vy *= FRICTION;
                
                // Update position
                this.x += this.vx * (slowMotion > 0 ? 0.3 : 1);
                this.y += this.vy * (slowMotion > 0 ? 0.3 : 1);
                
                // Boundary collision
                if (this.x < this.radius) {
                    this.x = this.radius;
                    this.vx *= -0.8;
                    createParticles(this.x, this.y, 5, '#37F2FF', 2, 20);
                    playSFX('bounce');
                }
                if (this.x > width - this.radius) {
                    this.x = width - this.radius;
                    this.vx *= -0.8;
                    createParticles(this.x, this.y, 5, '#37F2FF', 2, 20);
                    playSFX('bounce');
                }
                if (this.y < this.radius) {
                    this.y = this.radius;
                    this.vy *= -0.8;
                    createParticles(this.x, this.y, 5, '#37F2FF', 2, 20);
                    playSFX('bounce');
                }
                
                // Bottom boundary - reset if ball falls off-screen
                if (this.y > height + 50) {
                    this.loseLife();
                }
                
                // Check collisions with obstacles
                obstacles.forEach(obstacle => {
                    if (this.collidesWith(obstacle)) {
                        this.handleCollision(obstacle);
                        playSFX('bounce');
                    }
                });
                
                // Check collisions with targets
                targets.forEach((target, index) => {
                    if (!target.hit && this.collidesWith(target)) {
                        target.hit = true;
                        hitsRequired--;
                        updateProgressBar();
                        
                        // Increase score
                        const hitScore = 100 * (1 + combo * 0.1) * currentLevel;
                        score += Math.floor(hitScore);
                        updateScore();
                        
                        // Combo system
                        combo++;
                        if (combo > 1) {
                            showCombo(combo);
                        }
                        
                        // Create particles
                        createParticles(target.x, target.y, 20, target.color, 3, 30);
                        
                        // Chance to spawn power-up
                        if (Math.random() < 0.1 * selectedDifficulty) {
                            spawnPowerUp(target.x, target.y);
                        }
                        
                        // Screen effects
                        screenShake = 5;
                        
                        // Play hit sound
                        playSFX('hit');
                        
                        // Check if level is complete
                        if (hitsRequired <= 0) {
                            levelComplete();
                        }
                    }
                });
                
                // Check collisions with power-ups
                powerUps.forEach((powerUp, index) => {
                    if (this.collidesWith(powerUp)) {
                        this.applyPowerUp(powerUp.type);
                        powerUps.splice(index, 1);
                        createParticles(powerUp.x, powerUp.y, 15, powerUp.color, 2, 25);
                        playSFX('powerup');
                    }
                });
            }
            
            // Launch input visualization
            if (isDragging && this.canLaunch) {
                const dx = touchStart.x - touchEnd.x;
                const dy = touchStart.y - touchEnd.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const power = Math.min(distance / 10, MAX_POWER);
                
                // Draw launch trajectory preview
                if (power > 1) {
                    const steps = 10;
                    const stepX = dx / 10 / steps;
                    const stepY = dy / 10 / steps;
                    
                    CTX.beginPath();
                    CTX.moveTo(this.x, this.y);
                    
                    let previewX = this.x;
                    let previewY = this.y;
                    
                    for (let i = 0; i < steps; i++) {
                        previewX -= stepX;
                        previewY -= stepY;
                        CTX.lineTo(previewX, previewY);
                    }
                    
                    CTX.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    CTX.lineWidth = 3;
                    CTX.stroke();
                }
            }
        }
        
        draw() {
            // Draw player shadow
            CTX.beginPath();
            CTX.arc(this.x + 3, this.y + 3, this.radius, 0, Math.PI * 2);
            CTX.fillStyle = 'rgba(0, 0, 0, 0.3)';
            CTX.fill();
            
            // Draw player
            CTX.beginPath();
            CTX.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            
            // Draw power-up effect
            if (this.powerUp === 'multiball') {
                const gradient = CTX.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(1, '#FF3EA5');
                CTX.fillStyle = gradient;
            } else if (this.powerUp === 'slowmo') {
                const gradient = CTX.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(1, '#37F2FF');
                CTX.fillStyle = gradient;
            } else {
                CTX.fillStyle = this.color;
            }
            
            CTX.fill();
            
            // Add glow effect
            CTX.beginPath();
            CTX.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
            CTX.strokeStyle = this.color;
            CTX.lineWidth = 2;
            CTX.stroke();
            
            // Draw direction indicator when can launch
            if (this.canLaunch) {
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
                CTX.fillStyle = '#FFFFFF';
                CTX.fill();
            }
        }
        
        collidesWith(obj) {
            const dx = this.x - obj.x;
            const dy = this.y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < this.radius + obj.radius;
        }
        
        handleCollision(obj) {
            // Calculate collision normal
            const dx = this.x - obj.x;
            const dy = this.y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize the collision normal
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Calculate relative velocity
            const relativeVelocity = this.vx * nx + this.vy * ny;
            
            // Do not resolve if objects are moving away from each other
            if (relativeVelocity > 0) {
                // Calculate impulse scalar
                const impulse = 2 * relativeVelocity;
                
                // Apply impulse
                this.vx += impulse * nx;
                this.vy += impulse * ny;
                
                // Adjust position to prevent sticking
                const overlap = this.radius + obj.radius - distance;
                this.x += overlap * nx;
                this.y += overlap * ny;
                
                // Create particles
                createParticles(this.x - nx * this.radius, this.y - ny * this.radius, 5, '#FFFFFF', 2, 15);
            }
        }
        
        loseLife() {
            lives--;
            updateLivesDisplay();
            
            // Shake screen
            screenShake = 10;
            
            // Reset player
            this.resetPosition();
            
            // Reset combo
            combo = 0;
            
            // Check game over
            if (lives <= 0) {
                gameOver();
            }
        }
        
        applyPowerUp(type) {
            this.powerUp = type;
            this.powerUpTimer = 300; // 5 seconds at 60fps
            
            switch (type) {
                case 'multiball':
                    // Spawn extra balls (in future implementation)
                    break;
                case 'slowmo':
                    slowMotion = 300; // 5 seconds of slow motion
                    CANVAS.style.filter = 'brightness(1.2) contrast(1.2)';
                    break;
                case 'extralife':
                    if (lives < 3) {
                        lives++;
                        updateLivesDisplay();
                        const lifeElements = document.querySelectorAll('.life');
                        lifeElements[lives - 1].classList.add('pulse');
                        setTimeout(() => {
                            lifeElements[lives - 1].classList.remove('pulse');
                        }, 2000);
                    } else {
                        // Extra score instead
                        score += 500 * currentLevel;
                        updateScore();
                    }
                    break;
            }
            
            // Show power-up indicator
            showPowerUpIndicator(type);
        }
    }
    
    class Target {
        constructor(x, y, radius = 20) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.hit = false;
            this.color = getRandomColor();
            this.pulseTimer = 0;
            this.pulseDirection = 1;
            this.originalRadius = radius;
        }
        
        update() {
            if (!this.hit) {
                // Pulse animation
                this.pulseTimer += 0.05;
                const pulse = Math.sin(this.pulseTimer) * 2;
                this.radius = this.originalRadius + pulse;
            }
        }
        
        draw() {
            if (!this.hit) {
                // Draw glow
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
                CTX.fillStyle = this.color + '33'; // Add transparency
                CTX.fill();
                
                // Draw target
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                CTX.fillStyle = this.color;
                CTX.fill();
                
                // Draw inner circle
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
                CTX.fillStyle = '#FFFFFF33';
                CTX.fill();
                
                // Draw center dot
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
                CTX.fillStyle = '#FFFFFF';
                CTX.fill();
            }
        }
    }
    
    class Obstacle {
        constructor(x, y, radius = 30) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = '#4961FF';
            this.rotationAngle = 0;
            this.spikes = Math.floor(Math.random() * 3) + 4; // 4-6 spikes
        }
        
        update() {
            this.rotationAngle += 0.01;
        }
        
        draw() {
            // Draw shadow
            CTX.beginPath();
            CTX.arc(this.x + 5, this.y + 5, this.radius, 0, Math.PI * 2);
            CTX.fillStyle = 'rgba(0, 0, 0, 0.3)';
            CTX.fill();
            
            // Draw obstacle with spikes
            CTX.beginPath();
            
            // Draw spiky shape
            for (let i = 0; i < this.spikes * 2; i++) {
                const angle = (i * Math.PI / this.spikes) + this.rotationAngle;
                const radius = i % 2 === 0 ? this.radius : this.radius * 0.7;
                const x = this.x + radius * Math.cos(angle);
                const y = this.y + radius * Math.sin(angle);
                
                if (i === 0) {
                    CTX.moveTo(x, y);
                } else {
                    CTX.lineTo(x, y);
                }
            }
            
            CTX.closePath();
            
            // Create gradient
            const gradient = CTX.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );
            gradient.addColorStop(0, '#6B81FF');
            gradient.addColorStop(1, '#4961FF');
            
            CTX.fillStyle = gradient;
            CTX.fill();
            
            // Draw outline
            CTX.strokeStyle = '#37F2FF';
            CTX.lineWidth = 2;
            CTX.stroke();
            
            // Draw center
            CTX.beginPath();
            CTX.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
            CTX.fillStyle = '#FFFFFF';
            CTX.fill();
        }
    }
    
    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.radius = 15;
            this.type = type;
            this.vy = -2;
            this.rotationAngle = 0;
            
            // Set color based on type
            switch (type) {
                case 'multiball':
                    this.color = '#FB46F1';
                    break;
                case 'slowmo':
                    this.color = '#37F2FF';
                    break;
                case 'extralife':
                    this.color = '#FF3EA5';
                    break;
                default:
                    this.color = '#FFFFFF';
            }
        }
        
        update() {
            this.y += this.vy;
            this.vy += 0.05;
            this.rotationAngle += 0.1;
            
            // Remove if off screen
            if (this.y > height + 50) {
                const index = powerUps.indexOf(this);
                if (index !== -1) {
                    powerUps.splice(index, 1);
                }
            }
        }
        
        draw() {
            // Draw glow
            CTX.beginPath();
            CTX.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            CTX.fillStyle = this.color + '44'; // Add transparency
            CTX.fill();
            
            // Draw power-up icon based on type
            if (this.type === 'multiball') {
                // Draw multiple circles for multiball
                const angle1 = this.rotationAngle;
                const angle2 = this.rotationAngle + (2 * Math.PI / 3);
                const angle3 = this.rotationAngle + (4 * Math.PI / 3);
                const distance = this.radius * 0.5;
                
                CTX.beginPath();
                CTX.arc(this.x + Math.cos(angle1) * distance, this.y + Math.sin(angle1) * distance, this.radius * 0.5, 0, Math.PI * 2);
                CTX.arc(this.x + Math.cos(angle2) * distance, this.y + Math.sin(angle2) * distance, this.radius * 0.5, 0, Math.PI * 2);
                CTX.arc(this.x + Math.cos(angle3) * distance, this.y + Math.sin(angle3) * distance, this.radius * 0.5, 0, Math.PI * 2);
                CTX.fillStyle = this.color;
                CTX.fill();
            } else if (this.type === 'slowmo') {
                // Draw clock for slow motion
                CTX.beginPath();
                CTX.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                CTX.fillStyle = this.color;
                CTX.fill();
                
                // Clock hands
                CTX.beginPath();
                CTX.moveTo(this.x, this.y);
                CTX.lineTo(this.x + Math.cos(this.rotationAngle) * this.radius * 0.7, this.y + Math.sin(this.rotationAngle) * this.radius * 0.7);
                CTX.strokeStyle = '#FFFFFF';
                CTX.lineWidth = 2;
                CTX.stroke();
                
                CTX.beginPath();
                CTX.moveTo(this.x, this.y);
                CTX.lineTo(this.x + Math.cos(this.rotationAngle * 0.5) * this.radius * 0.5, this.y + Math.sin(this.rotationAngle * 0.5) * this.radius * 0.5);
                CTX.strokeStyle = '#FFFFFF';
                CTX.lineWidth = 2;
                CTX.stroke();
            } else if (this.type === 'extralife') {
                // Draw heart for extra life
                CTX.beginPath();
                CTX.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.2, this.radius * 0.5, Math.PI * 0.25, Math.PI * 1.5);
                CTX.arc(this.x + this.radius * 0.3, this.y - this.radius * 0.2, this.radius * 0.5, Math.PI * 1.5, Math.PI * 0.75 + Math.PI);
                CTX.lineTo(this.x, this.y + this.radius * 0.6);
                CTX.closePath();
                CTX.fillStyle = this.color;
                CTX.fill();
            }
        }
    }
    
    // Helper functions
    function getRandomColor() {
        const colors = ['#FF3EA5', '#FB46F1', '#4961FF', '#37F2FF', '#18FAC5'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function createParticles(x, y, count, color, speed = 2, lifetime = 20) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                radius: Math.random() * 5 + 2,
                color: color,
                lifetime: lifetime,
                maxLifetime: lifetime,
                alpha: 1
            });
        }
    }
    
    function spawnPowerUp(x, y) {
        const types = ['multiball', 'slowmo', 'extralife'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUps.push(new PowerUp(x, y, type));
    }
    
    function generateLevel(level, difficulty) {
        const levelWidth = width - 100;
        const levelHeight = height - 200;
        
        // Calculate number of targets and obstacles based on level and difficulty
        targetCount = Math.min(5 + level * 2, 20);
        const obstacleCount = Math.min(2 + level + difficulty, 15);
        
        // All targets need to be hit
        hitsRequired = targetCount;
        
        // Generate targets in a pattern
        for (let i = 0; i < targetCount; i++) {
            // Calculate position in a grid or pattern
            let x, y;
            
            if (level % 3 === 1) {
                // Grid pattern
                const cols = Math.ceil(Math.sqrt(targetCount));
                const rows = Math.ceil(targetCount / cols);
                const colWidth = levelWidth / cols;
                const rowHeight = levelHeight / rows;
                
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                x = 50 + colWidth / 2 + col * colWidth;
                y = 100 + rowHeight / 2 + row * rowHeight;
            } else if (level % 3 === 2) {
                // Circular pattern
                const angle = (i / targetCount) * Math.PI * 2;
                const radius = Math.min(levelWidth, levelHeight) * 0.4;
                
                x = width / 2 + Math.cos(angle) * radius;
                y = height / 2 - 100 + Math.sin(angle) * radius;
            } else {
                // Random pattern with minimum distance
                let validPosition = false;
                while (!validPosition) {
                    x = 50 + Math.random() * levelWidth;
                    y = 100 + Math.random() * levelHeight;
                    
                    // Check minimum distance from other targets
                    validPosition = true;
                    for (let j = 0; j < targets.length; j++) {
                        const dx = x - targets[j].x;
                        const dy = y - targets[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 80) {
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            
            // Create target with size variation based on difficulty
            const radius = 25 - (difficulty * 2);
            targets.push(new Target(x, y, radius));
        }
        
        // Generate obstacles
        for (let i = 0; i < obstacleCount; i++) {
            let x, y;
            let validPosition = false;
            
            while (!validPosition) {
                x = 50 + Math.random() * levelWidth;
                y = 100 + Math.random() * levelHeight;
                
                // Check minimum distance from targets
                validPosition = true;
                for (let j = 0; j < targets.length; j++) {
                    const dx = x - targets[j].x;
                    const dy = y - targets[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        validPosition = false;
                        break;
                    }
                }
                
                // Check minimum distance from player starting position
                const dx = x - player.x;
                const dy = y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    validPosition = false;
                }
                
                // Check minimum distance from other obstacles
                for (let j = 0; j < obstacles.length; j++) {
                    const dx = x - obstacles[j].x;
                    const dy = y - obstacles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 80) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Create obstacle with size variation
            const radius = 25 + (difficulty * 2);
            obstacles.push(new Obstacle(x, y, radius));
        }
    }
    
    // Main game loop
    function gameLoop() {
        // Clear canvas
        CTX.clearRect(0, 0, width, height);
        
        // Apply screen shake effect
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            CTX.translate(shakeX, shakeY);
            screenShake *= 0.9;
            if (screenShake < 0.5) screenShake = 0;
        }
        
        // Update slow motion effect
        if (slowMotion > 0) {
            slowMotion--;
            if (slowMotion <= 0) {
                CANVAS.style.filter = 'none';
            }
        }
        
        // Update and draw game objects
        if (gameState === 'playing') {
            // Update obstacles
            obstacles.forEach(obstacle => obstacle.update());
            
            // Update targets
            targets.forEach(target => target.update());
            
            // Update power-ups
            powerUps.forEach(powerUp => powerUp.update());
            
            // Update player
            player.update();
            
            // Draw obstacles
            obstacles.forEach(obstacle => obstacle.draw());
            
            // Draw targets
            targets.forEach(target => target.draw());
            
            // Draw power-ups
            powerUps.forEach(powerUp => powerUp.draw());
            
            // Draw player
            player.draw();
        }
        
        // Update and draw particles
        particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.lifetime--;
            particle.alpha = particle.lifetime / particle.maxLifetime;
            
            if (particle.lifetime <= 0) {
                particles.splice(index, 1);
            } else {
                CTX.beginPath();
                CTX.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                CTX.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
                CTX.fill();
            }
        });
        
        // Reset transformation after screen shake
        if (screenShake > 0) {
            CTX.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        // Continue game loop
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Initialize the game
    setupCanvas();
    showScreen('start');
});