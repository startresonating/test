document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const gameOverElement = document.getElementById('game-over');
    const gameOverMessage = document.getElementById('game-over-message');
    const restartButton = document.getElementById('restart-button');

    // Set canvas size to match container
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game state
    let gameRunning = false;
    let gameStartTime = 0;
    let gameTime = 0;
    let bugs = [];
    let bugSpawnRate = 1; // bugs per second
    let bugSpeed = 50; // pixels per second
    let lastBugSpawn = 0;
    let lastDifficultyIncrease = 0;
    let isDragging = false; // Track if the player is dragging Percy

    // Field dimensions (1.6:1 ratio)
    let fieldWidth, fieldHeight;
    let fieldX, fieldY;

    // Elephant (same size as field)
    let elephantRadius;
    let elephantX, elephantY;

    // Calculate game elements based on canvas size
    function calculateGameElements() {
        const minSize = Math.min(canvas.width, canvas.height);
        
        // Field is 1.6:1 ratio (50% smaller)
        fieldWidth = minSize * 0.2; // 50% of original 0.4
        fieldHeight = fieldWidth / 1.6;
        fieldX = canvas.width / 2;
        fieldY = canvas.height / 2;
        
        // Elephant is a circle of similar size (50% smaller)
        elephantRadius = Math.sqrt((fieldWidth * fieldHeight) / Math.PI) * 0.5; // 50% smaller
        elephantX = fieldX;
        elephantY = fieldY;
    }

    // Bug class
    class Bug {
        constructor() {
            this.radius = Math.random() * 3 + 2; // 2-5px
            this.color = Math.random() > 0.5 ? '#8B4513' : '#000000'; // Brown or black
            
            // Spawn from outside the canvas
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            
            switch(side) {
                case 0: // top
                    this.x = Math.random() * canvas.width;
                    this.y = -this.radius;
                    break;
                case 1: // right
                    this.x = canvas.width + this.radius;
                    this.y = Math.random() * canvas.height;
                    break;
                case 2: // bottom
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + this.radius;
                    break;
                case 3: // left
                    this.x = -this.radius;
                    this.y = Math.random() * canvas.height;
                    break;
            }
            
            // Calculate direction towards the field
            const dx = fieldX - this.x;
            const dy = fieldY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.directionX = dx / distance;
            this.directionY = dy / distance;
        }
        
        update(deltaTime) {
            // Move towards the field
            this.x += this.directionX * bugSpeed * deltaTime;
            this.y += this.directionY * bugSpeed * deltaTime;
        }
        
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
        
        collidesWith(x, y, width, height) {
            // Check if bug touches the rectangle (field)
            const closestX = Math.max(x - width/2, Math.min(this.x, x + width/2));
            const closestY = Math.max(y - height/2, Math.min(this.y, y + height/2));
            
            const distanceX = this.x - closestX;
            const distanceY = this.y - closestY;
            
            return (distanceX * distanceX + distanceY * distanceY) <= (this.radius * this.radius);
        }
        
        isInElephantRange(elephantX, elephantY, elephantRadius) {
            // Check if bug is within the elephant's range
            const dx = this.x - elephantX;
            const dy = this.y - elephantY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= elephantRadius + this.radius;
        }
    }

    // Draw game elements
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw field (yellow rectangle)
        ctx.fillStyle = '#FFD700'; // Yellow
        ctx.fillRect(fieldX - fieldWidth/2, fieldY - fieldHeight/2, fieldWidth, fieldHeight);
        
        // Draw elephant (purple circle)
        ctx.beginPath();
        ctx.arc(elephantX, elephantY, elephantRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#8A2BE2'; // Purple
        ctx.fill();
        ctx.closePath();
        
        // Draw bugs
        bugs.forEach(bug => bug.draw(ctx));
    }

    // Update game state
    function update(timestamp) {
        if (!gameRunning) return;
        
        // Calculate delta time in seconds
        const deltaTime = (timestamp - gameTime) / 1000;
        gameTime = timestamp;
        
        // Increase difficulty every 5 seconds
        if (timestamp - lastDifficultyIncrease >= 5000) {
            bugSpawnRate *= 1.5; // Increase spawn rate by 50%
            bugSpeed *= 1.1; // Increase speed by 10%
            lastDifficultyIncrease = timestamp;
        }
        
        // Spawn new bugs
        if (timestamp - lastBugSpawn >= 1000 / bugSpawnRate) {
            bugs.push(new Bug());
            lastBugSpawn = timestamp;
        }
        
        // Update bugs
        bugs.forEach(bug => bug.update(deltaTime));
        
        // Check for bugs reaching the field
        for (let i = 0; i < bugs.length; i++) {
            if (bugs[i].collidesWith(fieldX, fieldY, fieldWidth, fieldHeight)) {
                gameOver();
                return;
            }
            
            // Remove bugs caught by Percy
            if (bugs[i].isInElephantRange(elephantX, elephantY, elephantRadius)) {
                bugs.splice(i, 1);
                i--;
            }
        }
        
        // Don't add event listeners in update loop
        
        // Draw the game
        draw();
        
        // Continue game loop
        requestAnimationFrame(update);
    }

    // Start the game
    function startGame() {
        calculateGameElements();
        gameRunning = true;
        gameStartTime = performance.now();
        gameTime = gameStartTime;
        lastDifficultyIncrease = gameStartTime;
        bugs = [];
        bugSpawnRate = 1;
        bugSpeed = 50;
        lastBugSpawn = 0;
        
        gameOverElement.classList.add('hidden');
        
        requestAnimationFrame(update);
    }

    // Game over
    function gameOver() {
        gameRunning = false;
        const finalTime = (gameTime - gameStartTime) / 1000;
        gameOverMessage.textContent = `Percy the elephant failed to protect his daffodils from bugs. He lasted ${finalTime.toFixed(1)} seconds.`;
        gameOverElement.classList.remove('hidden');
    }

    // Event listeners
    restartButton.addEventListener('click', startGame);
    
    // Mouse and touch event listeners for dragging Percy
    function handleStart(e) {
        // Prevent default behavior for touch events
        if (e.type === 'touchstart') {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Check if touch is on the elephant
            const dx = touchX - elephantX;
            const dy = touchY - elephantY;
            if (Math.sqrt(dx * dx + dy * dy) <= elephantRadius * 2) {
                isDragging = true;
            }
        } else {
            isDragging = true;
        }
    }
    
    function handleMove(e) {
        if (!isDragging || !gameRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        if (e.type === 'touchmove') {
            e.preventDefault();
            const touch = e.touches[0];
            elephantX = touch.clientX - rect.left;
            elephantY = touch.clientY - rect.top;
        } else {
            elephantX = e.clientX - rect.left;
            elephantY = e.clientY - rect.top;
        }
    }
    
    function handleEnd() {
        isDragging = false;
    }
    
    // Add mouse events
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseout', handleEnd);
    
    // Add touch events for mobile
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleEnd);

    // Start game automatically when page loads
    startGame();
});