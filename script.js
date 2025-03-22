// Game variables
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;

let engine;
let render;
let world;
let ground;
let mouseConstraint;
let currentLevel = 1;
let requiredPolygons = 2;
let placedPolygons = 0;
let polygons = [];
let countdown = 10;
let gameState = 'setup'; // setup, stacking, blowing, gameover, nextlevel
let timerInterval;
let hairdryer;
let blowingForce = 0;
let blowingIntensity = 0;
let windParticles = [];

// Initialize the game when the window loads
window.onload = function() {
    initGame();
};

// Function to initialize the game
function initGame() {
    // Create the Matter.js engine
    engine = Engine.create({
        positionIterations: 10,
        velocityIterations: 8
    });
    world = engine.world;

    // Create the renderer
    const canvas = document.getElementById('game-canvas');
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#b3e0ff'
        }
    });

    // Adjust world gravity
    world.gravity.y = 1;

    // Create the ground
    const groundHeight = 20;
    const groundY = window.innerHeight - groundHeight / 2 - 10;
    ground = Bodies.rectangle(
        window.innerWidth / 2,
        groundY,
        window.innerWidth,
        groundHeight,
        { isStatic: true, friction: 1, restitution: 0.2 }
    );
    ground.render.fillStyle = '#228B22';
    
    World.add(world, ground);

    // Create mouse constraint for dragging
    const mouse = Mouse.create(canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    
    World.add(world, mouseConstraint);

    // Make the canvas responsive to the mouse
    render.mouse = mouse;

    // Disable global mouse events to prevent scrolling
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Start the engine and renderer
    Engine.run(engine);
    Render.run(render);

    // Add the hairdryer element
    createHairdryer();

    // Reset the game state
    resetGame();

    // Handle window resize
    window.addEventListener('resize', function() {
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;
        Render.setPixelRatio(render, window.devicePixelRatio);
        
        // Update ground position
        Body.setPosition(ground, {
            x: window.innerWidth / 2,
            y: window.innerHeight - groundHeight / 2 - 10
        });
    });

    // Add collision detection for game over checking
    Events.on(engine, 'collisionStart', function(event) {
        if (gameState === 'blowing') {
            checkTowerIntegrity();
        }
    });
}

// Function to create the hairdryer element
function createHairdryer() {
    hairdryer = document.createElement('div');
    hairdryer.className = 'hairdryer';
    hairdryer.innerHTML = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="30" width="30" height="40" rx="5" fill="#333" />
            <rect x="25" y="40" width="35" height="20" rx="5" fill="#555" />
            <circle cx="75" cy="50" r="5" fill="#777" />
        </svg>
    `;
    document.getElementById('game-container').appendChild(hairdryer);

    // Create wind particles container
    const windContainer = document.createElement('div');
    windContainer.className = 'wind';
    document.getElementById('game-container').appendChild(windContainer);

    // Create wind particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'wind-particle';
        windContainer.appendChild(particle);
        windParticles.push(particle);
    }
}

// Function to create a random polygon
function createPolygon() {
    const minSides = 3;
    const maxSides = 7;
    const sides = Math.floor(Math.random() * (maxSides - minSides + 1)) + minSides;
    const radius = 30 + Math.random() * 30;
    
    // Random position at the top of the screen
    const x = window.innerWidth / 2 + (Math.random() * 200 - 100);
    const y = 100 + Math.random() * 50;
    
    // Random color
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 60%)`;
    
    // Create the polygon with random variations in vertices
    const polygon = Bodies.polygon(x, y, sides, radius, {
        friction: 0.8,
        restitution: 0.2,
        density: 0.003,
        render: {
            fillStyle: color,
            strokeStyle: '#000',
            lineWidth: 2
        }
    });
    
    // Add some randomness to the shape by slightly moving vertices
    const vertices = polygon.vertices;
    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];
        const variation = radius * 0.2; // 20% variation
        vertex.x += (Math.random() * variation * 2) - variation;
        vertex.y += (Math.random() * variation * 2) - variation;
    }
    
    World.add(world, polygon);
    polygons.push(polygon);
    placedPolygons++;
    updatePolygonCount();
    
    return polygon;
}

// Function to update the polygon count display
function updatePolygonCount() {
    document.getElementById('polygon-count').textContent = `Polygons: ${placedPolygons}/${requiredPolygons}`;
}

// Function to start the countdown timer
function startCountdown() {
    updateTimerDisplay();
    timerInterval = setInterval(function() {
        countdown--;
        updateTimerDisplay();
        
        if (countdown <= 0) {
            clearInterval(timerInterval);
            startBlowing();
        }
    }, 1000);
}

// Function to update the timer display
function updateTimerDisplay() {
    document.getElementById('timer').textContent = countdown;
}

// Function to show a message overlay
function showMessage(message, duration) {
    const overlay = document.getElementById('message-overlay');
    const text = document.getElementById('message-text');
    
    text.textContent = message;
    overlay.classList.add('visible');
    
    setTimeout(function() {
        overlay.classList.remove('visible');
    }, duration);
}

// Function to start the blowing phase
function startBlowing() {
    gameState = 'blowing';
    hairdryer.classList.add('visible');
    
    // Start with low intensity
    setBlowingIntensity(1);
    
    // Increase to medium intensity after 2 seconds
    setTimeout(function() {
        setBlowingIntensity(2);
        
        // Increase to high intensity after another 2 seconds
        setTimeout(function() {
            setBlowingIntensity(3);
            
            // Stop blowing after another 2 seconds
            setTimeout(function() {
                stopBlowing();
                checkTowerResult();
            }, 2000);
        }, 2000);
    }, 2000);
}

// Function to set the blowing intensity
function setBlowingIntensity(intensity) {
    blowingIntensity = intensity;
    
    switch (intensity) {
        case 1:
            blowingForce = 0.0005;
            animateWindParticles(1);
            break;
        case 2:
            blowingForce = 0.0015;
            animateWindParticles(2);
            break;
        case 3:
            blowingForce = 0.003;
            animateWindParticles(3);
            break;
        default:
            blowingForce = 0;
            animateWindParticles(0);
    }
}

// Function to animate wind particles
function animateWindParticles(intensity) {
    windParticles.forEach((particle, index) => {
        const size = 3 + Math.random() * 5;
        const speed = 0.5 + Math.random() * 1.5;
        const delay = index * 50;
        const distance = 100 + Math.random() * 200;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = intensity === 0 ? 0 : 0.7;
        
        if (intensity > 0) {
            particle.style.right = `-${size}px`;
            particle.style.top = `${30 + Math.random() * 40}%`;
            
            setTimeout(() => {
                particle.style.transition = `right ${speed / intensity}s linear`;
                particle.style.right = `${distance}px`;
                
                setTimeout(() => {
                    particle.style.opacity = 0;
                    setTimeout(() => {
                        particle.style.transition = 'none';
                        particle.style.right = `-${size}px`;
                        if (blowingIntensity === intensity) {
                            animateWindParticle(particle, intensity);
                        }
                    }, 100);
                }, (speed / intensity) * 1000);
            }, delay);
        }
    });
}

// Function to animate a single wind particle
function animateWindParticle(particle, intensity) {
    const size = 3 + Math.random() * 5;
    const speed = 0.5 + Math.random() * 1.5;
    const distance = 100 + Math.random() * 200;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.top = `${30 + Math.random() * 40}%`;
    particle.style.opacity = 0.7;
    
    setTimeout(() => {
        particle.style.transition = `right ${speed / intensity}s linear`;
        particle.style.right = `${distance}px`;
        
        setTimeout(() => {
            particle.style.opacity = 0;
            setTimeout(() => {
                particle.style.transition = 'none';
                particle.style.right = `-${size}px`;
                if (blowingIntensity === intensity) {
                    animateWindParticle(particle, intensity);
                }
            }, 100);
        }, (speed / intensity) * 1000);
    }, 50);
}

// Function to apply wind force to polygons
function applyWindForce() {
    if (blowingForce > 0) {
        polygons.forEach(polygon => {
            // Apply force based on the size of the polygon
            const area = polygon.area;
            const force = blowingForce * area;
            Body.applyForce(polygon, polygon.position, { x: -force, y: 0 });
        });
    }
}

// Function to stop the blowing phase
function stopBlowing() {
    blowingForce = 0;
    hairdryer.classList.remove('visible');
    animateWindParticles(0);
}

// Function to check if the tower is still intact
function checkTowerIntegrity() {
    // Check if any polygon is below the ground level or far off the screen
    const groundY = ground.position.y - ground.bounds.max.y + ground.bounds.min.y;
    let towerIntact = true;
    
    polygons.forEach(polygon => {
        if (polygon.position.y > groundY || 
            polygon.position.x < -100 || 
            polygon.position.x > window.innerWidth + 100) {
            towerIntact = false;
        }
    });
    
    return towerIntact;
}

// Function to check the result after blowing
function checkTowerResult() {
    const towerIntact = checkTowerIntegrity();
    
    if (towerIntact && blowingIntensity >= 2) {
        // Tower survived at least medium intensity
        gameState = 'nextlevel';
        showMessage("Next Level", 2000);
        
        setTimeout(function() {
            currentLevel++;
            resetForNextLevel();
        }, 2000);
    } else {
        // Tower fell or didn't survive medium intensity
        gameState = 'gameover';
        showMessage("Game Over", 2000);
        
        setTimeout(function() {
            resetGame();
        }, 2000);
    }
}

// Function to reset for the next level
function resetForNextLevel() {
    // Clear all polygons
    polygons.forEach(polygon => {
        World.remove(world, polygon);
    });
    polygons = [];
    
    // Increase required polygons
    requiredPolygons = Math.min(currentLevel + 1, 7);
    placedPolygons = 0;
    
    // Update level display
    document.getElementById('level-display').textContent = `Level: ${currentLevel}`;
    updatePolygonCount();
    
    // Reset countdown
    countdown = 10;
    updateTimerDisplay();
    
    // Start stacking phase
    gameState = 'stacking';
    startCountdown();
}

// Function to completely reset the game
function resetGame() {
    // Clear all polygons
    polygons.forEach(polygon => {
        World.remove(world, polygon);
    });
    polygons = [];
    
    // Reset game variables
    currentLevel = 1;
    requiredPolygons = 2;
    placedPolygons = 0;
    countdown = 10;
    
    // Update displays
    document.getElementById('level-display').textContent = `Level: ${currentLevel}`;
    updatePolygonCount();
    updateTimerDisplay();
    
    // Start the game
    gameState = 'stacking';
    startCountdown();
}

// Game loop
(function gameLoop() {
    // Apply wind force during blowing phase
    if (gameState === 'blowing') {
        applyWindForce();
    }
    
    // Create new polygons during stacking if needed
    if (gameState === 'stacking' && placedPolygons < requiredPolygons) {
        // Check if we need to create a new polygon
        const activePolygon = mouseConstraint.body;
        const shouldCreateNew = !activePolygon && polygons.length < requiredPolygons;
        
        if (shouldCreateNew) {
            createPolygon();
        }
    }
    
    requestAnimationFrame(gameLoop);
})();