// Game state
const gameState = {
    currentNPC: 0,
    npcs: [
        { name: "Old Woman", description: "An old woman struggles to carry a heavy basket of apples.", happiness: 0, visited: false },
        { name: "Young Boy", description: "A young boy sits on a bench, crying, holding a broken toy cart.", happiness: 0, visited: false },
        { name: "Merchant", description: "A merchant's stall awning has collapsed, exposing his wares to the harsh sun.", happiness: 0, visited: false }
    ],
    gameOver: false
};

// DOM elements
const textArea = document.getElementById("text-area");
const buttons = [
    document.getElementById("button1"),
    document.getElementById("button2"),
    document.getElementById("button3"),
    document.getElementById("button4")
];
const restartButton = document.getElementById("restart-button");

// Action sets for each NPC
const npcActions = [
    // Old Woman actions
    [
        {
            text: "Offer to carry the basket",
            result: "You gently take the basket from the old woman's hands. The weight surprises you, but you manage to hold it steady. 'Oh, bless you,' she says with relief. 'These old bones aren't what they used to be.'",
            thought: "It feels good to ease her burden.",
            happinessChange: 2
        },
        {
            text: "Smile encouragingly",
            result: "You offer a warm smile to the old woman. She returns it, her face brightening slightly. 'Such a kind face,' she murmurs, shifting the basket in her arms.",
            thought: "A small gesture can mean a lot.",
            happinessChange: 1
        },
        {
            text: "Offer a reassuring nod",
            result: "You nod reassuringly at the old woman. She seems to stand a little straighter, finding some strength in your silent encouragement. The basket still weighs heavily in her arms, but her determination grows.",
            thought: "Sometimes all people need is acknowledgment.",
            happinessChange: 1
        },
        {
            text: "Rest",
            result: "You feel tired. You close your eyes, and feel like you're about to enter a dream, but then you snap back to reality.",
            thought: "Maybe I should have helped...",
            happinessChange: 0
        }
    ],
    // Young Boy actions
    [
        {
            text: "Try to fix the toy",
            result: function() {
                // Random success or partial success
                const randomOutcome = Math.random();
                if (randomOutcome > 0.6) {
                    return {
                        result: "You examine the broken toy cart carefully. The wheel has come loose, but the axle is intact. With careful hands, you reattach the wheel. The boy's tears stop as he watches in amazement. When you hand it back, his face lights up with pure joy. 'It works! Thank you!'",
                        thought: "His smile makes it all worthwhile.",
                        happinessChange: 3
                    };
                } else {
                    return {
                        result: "You examine the broken toy cart. The damage is worse than it looked—the axle is bent and a wheel is cracked. You make some adjustments that improve it, but it's still not fully fixed. The boy appreciates your effort though, his sobs quieting to sniffles. 'Thanks for trying,' he says softly.",
                        thought: "At least I could help a little.",
                        happinessChange: 2
                    };
                }
            }
        },
        {
            text: "Pat him on the shoulder",
            result: "You gently pat the boy's shoulder. He looks up at you, tears still streaming down his face, but there's a moment of connection. His crying softens slightly, finding comfort in your presence.",
            thought: "Sometimes we all need human touch.",
            happinessChange: 1
        },
        {
            text: "Offer a comforting gesture",
            result: "You kneel down to the boy's level and make a sympathetic face, placing your hand over your heart. He watches you curiously through his tears, momentarily distracted from his sadness. 'Are you saying it'll be okay?' he asks between sniffles.",
            thought: "Connection doesn't always need words.",
            happinessChange: 1
        },
        {
            text: "Rest",
            result: "You feel tired. You close your eyes, and feel like you're about to enter a dream, but then you snap back to reality.",
            thought: "The sound of his crying lingers in my mind...",
            happinessChange: 0
        }
    ],
    // Merchant actions
    [
        {
            text: "Help lift the awning",
            result: "You step forward and help the merchant lift the fallen awning. Together, you secure it back into place. The colorful fabrics and wares are once again protected from the harsh sun. 'Perfect timing, friend!' the merchant exclaims. 'Couldn't have done it so quickly alone.'",
            thought: "Teamwork makes difficult tasks manageable.",
            happinessChange: 2
        },
        {
            text: "Offer him your water skin",
            result: "You offer your water skin to the merchant. He looks surprised, then grateful as he takes a long drink. 'Most appreciated,' he says, wiping his brow. 'The sun's been merciless today.' He returns to struggling with the awning, but with renewed energy.",
            thought: "Sometimes the simplest aid is what's needed most.",
            happinessChange: 1
        },
        {
            text: "Offer to stand and block the sun",
            result: "You position yourself to cast a shadow over the merchant's more delicate wares. He notices your silent assistance and chuckles. 'Well, that's one way to help! Creative, I'll give you that.' You stand there awkwardly but proudly as he works on fixing the awning.",
            thought: "Improvised solutions can be strangely satisfying.",
            happinessChange: 1
        },
        {
            text: "Rest",
            result: "You feel tired. You close your eyes, and feel like you're about to enter a dream, but then you snap back to reality.",
            thought: "I wonder if he managed to fix it himself...",
            happinessChange: 0
        }
    ]
];

// Followup text for NPCs who have already been helped
const followupText = [
    // Old Woman followup
    [
        "The old woman now stands more comfortably, her basket problem resolved. She smiles warmly when she sees you looking her way.",
        "The old woman waves cheerfully at you. 'Thank you again, dear. My daughter will be so pleased with these apples.'",
        "The old woman is now sitting on a nearby bench, arranging her apples with care. She looks content."
    ],
    // Young Boy followup
    [
        "The boy is still on the bench, but his crying has subsided. He fiddles with his toy, trying to make it work.",
        "The boy is now playing quietly with his partially fixed toy. He gives you a small, grateful smile.",
        "The boy runs past you, pushing his repaired toy cart with delight, making 'whoosh' sounds as he goes."
    ],
    // Merchant followup
    [
        "The merchant continues adjusting his awning, making progress but still struggling with the final corner.",
        "The merchant's stall is now properly shaded. He arranges his wares with renewed enthusiasm.",
        "The merchant's stall is bustling with customers now that it's properly set up. He gives you a thankful nod as he conducts his business."
    ]
];

// Initialize the game
function initGame() {
    // Reset game state
    gameState.currentNPC = 0;
    gameState.gameOver = false;
    gameState.npcs.forEach(npc => {
        npc.happiness = 0;
        npc.visited = false;
    });
    
    // Hide restart button
    restartButton.style.display = "none";
    
    // Show introduction
    displayIntroduction();
}

// Display introduction
function displayIntroduction() {
    textArea.innerHTML = `
        <div class="narrative">
            You arrive in a small village square as the afternoon sun casts long shadows. 
            A gentle breeze carries the scent of baked goods and the distant sound of conversation.
            You are a wanderer, unable to speak, but your eyes are keen to observe and your hands ready to help.
        </div>
        <div class="thought">I wonder what stories this place holds...</div>
    `;
    
    // Set button text
    buttons[0].textContent = "Look around the square";
    buttons[1].disabled = true;
    buttons[2].disabled = true;
    buttons[3].disabled = true;
    
    // Add active class to first button
    buttons[0].classList.add("active-button");
    
    // Add event listener for the first button only
    buttons[0].onclick = () => {
        displayCurrentNPC();
    };
}

// Display current NPC
function displayCurrentNPC() {
    const npc = gameState.npcs[gameState.currentNPC];
    
    // Clear previous button event listeners
    buttons.forEach(button => {
        button.onclick = null;
        button.classList.remove("active-button");
        button.disabled = false;
    });
    
    // If NPC has been visited already
    if (npc.visited) {
        displayFollowup();
        return;
    }
    
    // Update text area with NPC description
    textArea.innerHTML = `
        <div class="narrative">
            As you walk through the village square, your attention is drawn to a figure nearby.
        </div>
        <div class="npc-description">
            ${npc.description}
        </div>
    `;
    
    // Set action buttons
    const actions = npcActions[gameState.currentNPC];
    actions.forEach((action, index) => {
        buttons[index].textContent = action.text;
        buttons[index].onclick = () => handleAction(index);
    });
    
    // Mark first non-rest action button as active
    buttons[0].classList.add("active-button");
}

// Display followup for already visited NPC
function displayFollowup() {
    const npc = gameState.npcs[gameState.currentNPC];
    const followupIndex = Math.min(npc.happiness - 1, 2);
    
    if (followupIndex >= 0) {
        textArea.innerHTML += `
            <div class="narrative">
                ${followupText[gameState.currentNPC][followupIndex]}
            </div>
        `;
    } else {
        textArea.innerHTML += `
            <div class="narrative">
                ${npc.description} They don't seem to have noticed your presence yet.
            </div>
        `;
    }
    
    // Only allow "Continue" action for already visited NPCs
    buttons[0].textContent = "Continue on your way";
    buttons[0].classList.add("active-button");
    buttons[0].onclick = () => moveToNextNPC();
    
    buttons[1].disabled = true;
    buttons[2].disabled = true;
    buttons[3].disabled = true;
}

// Handle action button clicks
function handleAction(buttonIndex) {
    const npc = gameState.npcs[gameState.currentNPC];
    const action = npcActions[gameState.currentNPC][buttonIndex];
    
    // Process the action
    let result, thought, happinessChange;
    
    // Check if the action has a function for dynamic results
    if (typeof action.result === 'function') {
        const outcome = action.result();
        result = outcome.result;
        thought = outcome.thought;
        happinessChange = outcome.happinessChange;
    } else {
        result = action.result;
        thought = action.thought;
        happinessChange = action.happinessChange;
    }
    
    // Update NPC happiness
    npc.happiness += happinessChange;
    // Cap happiness at 3
    npc.happiness = Math.min(npc.happiness, 3);
    // Mark NPC as visited
    npc.visited = true;
    
    // Display action result
    textArea.innerHTML += `
        <div class="result">
            ${result}
        </div>
        <div class="thought">
            ${thought}
        </div>
    `;
    
    // Auto-scroll to bottom of text area
    textArea.scrollTop = textArea.scrollHeight;
    
    // Clear button event listeners
    buttons.forEach(button => {
        button.onclick = null;
        button.disabled = true;
        button.classList.remove("active-button");
    });
    
    // Set Continue button
    buttons[0].textContent = "Continue on your way";
    buttons[0].disabled = false;
    buttons[0].classList.add("active-button");
    buttons[0].onclick = () => moveToNextNPC();
}

// Move to next NPC
function moveToNextNPC() {
    gameState.currentNPC = (gameState.currentNPC + 1) % gameState.npcs.length;
    
    // Check if we've completed a full cycle
    const allVisited = gameState.npcs.every(npc => npc.visited);
    
    if (allVisited) {
        endGame();
    } else {
        displayCurrentNPC();
    }
}

// End the game
function endGame() {
    gameState.gameOver = true;
    
    // Calculate total happiness
    const totalHappiness = gameState.npcs.reduce((sum, npc) => sum + npc.happiness, 0);
    
    // Determine ending text
    let endingText;
    if (totalHappiness >= 7) {
        endingText = "The village square feels brighter. The old woman smiles, the boy plays happily, and the merchant's business thrives. You feel a sense of quiet satisfaction.";
    } else if (totalHappiness >= 4) {
        endingText = "The village square is a little better than you found it. Some problems remain, but you've made a difference.";
    } else {
        endingText = "The village square remains a place of struggle. You wonder if you could have done more.";
    }
    
    // Display ending
    textArea.innerHTML = `
        <div class="narrative">
            As the sun begins to set, you take one last look at the village square.
        </div>
        <div class="narrative">
            ${endingText}
        </div>
        <div class="narrative">
            Without a word—as always—you turn and continue on your journey. 
            Perhaps another village awaits your silent help tomorrow.
        </div>
        <div class="thought">
            The greatest reward is knowing I made a difference, however small.
        </div>
    `;
    
    // Disable all action buttons
    buttons.forEach(button => {
        button.disabled = true;
        button.classList.remove("active-button");
        button.onclick = null;
    });
    
    // Show restart button
    restartButton.style.display = "block";
    restartButton.onclick = initGame;
}

// Start the game
initGame();