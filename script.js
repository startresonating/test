document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded");
    
    // DOM Elements
    const introScreen = document.getElementById('intro-screen');
    const startGameButton = document.getElementById('start-game');
    const gameContainer = document.getElementById('game-container');
    const dayDisplay = document.getElementById('day-display');
    const timeDisplay = document.getElementById('time-display');
    const logButton = document.getElementById('log-button');
    const locationImage = document.getElementById('location-image');
    const narrativeText = document.getElementById('narrative-text');
    const internalMonologue = document.getElementById('internal-monologue');
    const actionButtons = Array.from(document.querySelectorAll('.action-button'));
    const logModal = document.getElementById('log-modal');
    const logEntries = document.getElementById('log-entries');
    const closeButton = document.querySelector('.close-button');
    const endingScreen = document.getElementById('ending-screen');
    const endingText = document.getElementById('ending-text');
    const playAgainButton = document.getElementById('play-again');
    const itemNotification = document.getElementById('item-notification');
    const itemMessage = document.getElementById('item-message');

    // Game State
    let gameState = {
        // Time & Progress
        day: 1,
        timeUnit: 0, // 0: Morning, 1: Afternoon, 2: Evening, 3: Night
        timeUnits: ['Morning', 'Afternoon', 'Evening', 'Night'],
        location: 'village_entrance',
        
        // Player Stats
        compassion: 20,
        insight: 20, 
        courage: 20,
        perceptionScore: 15,
        sleeplessness: 0,
        
        // Items & Gestures
        items: [],
        learnedGestures: [],
        
        // Village & NPCs
        villageChallenge: null,
        villageMorale: 50,
        npcRelationships: {
            elder: 0,
            innkeeper: 0,
            healer: 0,
            farmer: 0,
            child: 0
        },
        npcMoods: {
            elder: 'neutral',
            innkeeper: 'neutral',
            healer: 'neutral',
            farmer: 'neutral',
            child: 'neutral'
        },
        
        // Events & Logs
        logEntries: [],
        hasBrokenVow: false,
        gameEnded: false,
        
        // Daily Virtue Changes
        dailyVirtueChanges: {
            compassion: 0,
            insight: 0,
            courage: 0
        },
        
        // Core Story Flags
        storyFlags: {}
    };

    // Location data - image URLs and descriptions
    const locations = {
        village_entrance: {
            name: "Village Entrance",
            image: "url('https://via.placeholder.com/800x400/87CEEB/333333?text=Village+Entrance')",
            description: "A weathered wooden sign marks the entrance to the small village. Dirt paths wind between modest cottages, smoke curling from their chimneys. The sounds of daily life echo in the distance.",
            firstVisit: true
        },
        village_square: {
            name: "Village Square",
            image: "url('https://via.placeholder.com/800x400/F5DEB3/333333?text=Village+Square')",
            description: "The heart of the village - a modest square with a central well where villagers gather throughout the day. Market stalls line one side, while a community board holds announcements.",
            firstVisit: true
        },
        inn: {
            name: "The Humble Hearth Inn",
            image: "url('https://via.placeholder.com/800x400/8B4513/FFFFFF?text=Humble+Hearth+Inn')",
            description: "A cozy two-story building with weathered wooden beams. Inside, a warm fire crackles in the hearth, and the smell of fresh bread fills the air. A few tables and chairs are scattered about.",
            firstVisit: true
        },
        healers_hut: {
            name: "Healer's Hut",
            image: "url('https://via.placeholder.com/800x400/556B2F/FFFFFF?text=Healer%27s+Hut')",
            description: "A small, round hut at the village edge, surrounded by herb gardens. Bundles of dried plants hang from the ceiling inside, and the air smells of earthy remedies and fresh mint.",
            firstVisit: true
        },
        elder_home: {
            name: "Elder's Home",
            image: "url('https://via.placeholder.com/800x400/708090/FFFFFF?text=Elder%27s+Home')",
            description: "The largest house in the village, though still modest. Well-maintained with carvings on the wooden beams. Inside, shelves of books and scrolls line the walls.",
            firstVisit: true
        },
        farm: {
            name: "Community Farm",
            image: "url('https://via.placeholder.com/800x400/228B22/FFFFFF?text=Community+Farm')",
            description: "Neat rows of crops stretch across fertile soil, with simple irrigation channels running between them. A few villagers work the land, and livestock graze in a nearby pen.",
            firstVisit: true
        },
        forest_edge: {
            name: "Forest Edge",
            image: "url('https://via.placeholder.com/800x400/006400/FFFFFF?text=Forest+Edge')",
            description: "Ancient trees mark the boundary between the village and the wild forest beyond. The air is cooler here, filled with the sounds of birds and rustling leaves.",
            firstVisit: true
        },
        river: {
            name: "Village River",
            image: "url('https://via.placeholder.com/800x400/4682B4/FFFFFF?text=Village+River')",
            description: "A clear, flowing river that provides the village with water. A simple wooden bridge crosses its narrowest point, and a path along the bank leads to a quiet fishing spot.",
            firstVisit: true
        }
    };

    // NPCs
    const npcs = {
        elder: {
            name: "Elder Thaddeus",
            description: "A tall, lean man with a long silver beard and kind eyes that miss nothing. He walks with the aid of a carved wooden staff and speaks deliberately, each word carefully chosen.",
            location: "elder_home",
            schedule: {
                Morning: "elder_home",
                Afternoon: "village_square",
                Evening: "elder_home",
                Night: "elder_home"
            },
            gesture: "hand_to_heart",
            initialInteraction: "The village elder regards you with measured curiosity. His weathered face betrays no judgment at your silence, only a patient assessment as he waits to see what kind of visitor you might be."
        },
        innkeeper: {
            name: "Innkeeper Mara",
            description: "A robust woman with flour-dusted hands and a throaty laugh. Her curly auburn hair is tied back, and her apron bears the stains of years of honest work.",
            location: "inn",
            schedule: {
                Morning: "inn",
                Afternoon: "inn",
                Evening: "inn",
                Night: "inn"
            },
            gesture: "bow_with_fist_in_palm",
            initialInteraction: "The innkeeper glances up from wiping down the counter, her eyebrows rising slightly at your silent entrance. She offers a nod of acknowledgment and gestures to an empty table, waiting to see if you'll take a seat."
        },
        healer: {
            name: "Healer Sylva",
            description: "A slender person of indeterminate age with steady hands and observant eyes. Their hair is woven with small charms and beads, and they move with deliberate grace.",
            location: "healers_hut",
            schedule: {
                Morning: "healers_hut",
                Afternoon: "healers_hut",
                Evening: "healers_hut",
                Night: "healers_hut"
            },
            gesture: "fingers_to_pulse",
            initialInteraction: "The healer looks up from sorting herbs, their eyes quickly scanning you for signs of injury or illness. Finding none, their posture relaxes slightly, though their gaze remains curious and evaluating."
        },
        farmer: {
            name: "Farmer Eadric",
            description: "A sun-bronzed man with strong shoulders and calloused hands. His face is lined from years of weather, but his smile comes easily when earned.",
            location: "farm",
            schedule: {
                Morning: "farm",
                Afternoon: "farm",
                Evening: "village_square",
                Night: "inn"
            },
            gesture: "earth_touch",
            initialInteraction: "The farmer pauses in his work, leaning on his hoe as he studies you. Sweat glistens on his brow, and he wipes it with a forearm before giving you a cautious nod, his stance neither welcoming nor dismissive."
        },
        child: {
            name: "Child Lina",
            description: "A bright-eyed child of about ten with untidy hair and quick movements. She carries a small cloth doll and seems to notice everything around her.",
            location: "village_square",
            schedule: {
                Morning: "village_square",
                Afternoon: "forest_edge",
                Evening: "village_square",
                Night: "elder_home"
            },
            gesture: "firefly_hands",
            initialInteraction: "The child stops her play, staring at you with unabashed curiosity. She clutches her doll tighter and tilts her head, studying you as if you were a puzzle to solve. Unlike the adults, she seems fascinated rather than wary."
        }
    };

    // Village Challenges
    const villageChallenges = [
        {
            name: "Drought",
            description: "The river has shrunk to a trickle, crops are withering, and water is being strictly rationed. The village needs both immediate solutions and long-term planning.",
            signs: [
                "Withered crops in the farm fields",
                "Empty water barrels lined up near the well",
                "Arguments over water distribution in the village square",
                "Worried conversations about failed harvests"
            ],
            insightThreshold: 40 // Insight required to notice the problem
        },
        {
            name: "Social Division",
            description: "A recent dispute has divided the village into factions, with neighbors barely speaking to each other. The wound is fresh and both sides feel justified.",
            signs: [
                "Tense silences when certain villagers pass each other",
                "Hushed arguments that stop when noticed",
                "The village square feels unnaturally empty at times",
                "Children being kept away from former playmates"
            ],
            insightThreshold: 35
        },
        {
            name: "Recent Tragedy",
            description: "A tragic accident has left the village in mourning. Several families lost loved ones, and the community is struggling to process their grief.",
            signs: [
                "Black cloth hanging from some doorways",
                "Red-rimmed eyes and subdued voices",
                "A small memorial near the forest edge",
                "The absence of music or celebration"
            ],
            insightThreshold: 30
        },
        {
            name: "Hidden Poverty",
            description: "Behind closed doors, many villagers are struggling to make ends meet. A poor harvest, increased taxes, or economic changes have left families vulnerable.",
            signs: [
                "Thin children with patched clothing",
                "Empty market stalls where vendors once sold",
                "Multiple families sharing single homes",
                "Proud faces hiding hungry stomachs"
            ],
            insightThreshold: 35
        }
    ];

    // Items available in the game
    const gameItems = [
        {
            name: "Worn Journal",
            description: "A leather-bound journal with most pages torn out. The remaining entries hint at a troubled past and a quest for redemption.",
            uses: ["Read to gain insight", "Show to Elder Thaddeus", "Record observations"],
            location: "elder_home",
            combinable: true,
            comboPartner: "Quill"
        },
        {
            name: "Medicinal Herbs",
            description: "A bundle of carefully dried herbs with healing properties. They give off a soothing aroma when crushed.",
            uses: ["Treat minor injuries", "Brew tea", "Give to someone ill"],
            location: "healers_hut",
            combinable: true,
            comboPartner: "Clean Water"
        },
        {
            name: "Carved Whistle",
            description: "A simple wooden whistle carved in the shape of a bird. It produces a clear, sweet tone.",
            uses: ["Signal for attention", "Calm animals", "Entertain children"],
            location: "forest_edge",
            combinable: true,
            comboPartner: "Colorful String"
        },
        {
            name: "Mended Doll",
            description: "A child's doll that has been carefully repaired. The stitching is neat but visible, telling a story of care and attention.",
            uses: ["Return to child", "Carry as token", "Use as example of repair"],
            location: "village_square",
            combinable: false
        },
        {
            name: "Clean Water",
            description: "A small flask of clear, clean water. A precious resource in times of drought.",
            uses: ["Drink", "Water plants", "Clean wounds"],
            location: "river",
            combinable: true,
            comboPartner: "Medicinal Herbs"
        },
        {
            name: "Fresh Bread",
            description: "A small loaf of freshly baked bread, still warm to the touch. The aroma is enticing.",
            uses: ["Eat", "Share", "Feed animals"],
            location: "inn",
            combinable: false
        },
        {
            name: "Quill",
            description: "A well-crafted writing quill. Its nib is sharp and ready for use.",
            uses: ["Write messages", "Draw maps", "Signal intentions"],
            location: "elder_home",
            combinable: true,
            comboPartner: "Worn Journal"
        },
        {
            name: "Colorful String",
            description: "A length of vibrant, colored string. It could be used for crafting or as a simple marker.",
            uses: ["Mark a path", "Tie items", "Craft with children"],
            location: "healers_hut",
            combinable: true,
            comboPartner: "Carved Whistle"
        },
        {
            name: "Worn Map",
            description: "A weathered map of the surrounding area. Some locations are marked that aren't visible from the village.",
            uses: ["Navigate", "Study", "Show to Elder"],
            location: "forest_edge",
            combinable: false
        }
    ];

    // Combined items
    const combinedItems = {
        "Worn Journal+Quill": {
            name: "Personal Chronicle",
            description: "The journal with quill tucked into its binding - a complete tool for recording your journey and communicating complex ideas.",
            uses: ["Write detailed messages", "Record village history", "Share your story"]
        },
        "Medicinal Herbs+Clean Water": {
            name: "Healing Tonic",
            description: "A flask containing herbs steeped in clean water. The resulting tonic has stronger healing properties than either component alone.",
            uses: ["Heal illness", "Restore strength", "Offer comfort"]
        },
        "Carved Whistle+Colorful String": {
            name: "Child's Necklace",
            description: "The whistle threaded onto the colorful string creates a wearable toy that could bring joy to a child.",
            uses: ["Gift to child", "Use as peace offering", "Trade for information"]
        }
    };

    // Action types that affect virtues
    const actionEffects = {
        observe: { insight: 2, compassion: 0, courage: 0 },
        help: { compassion: 3, insight: 1, courage: 1 },
        confront: { courage: 3, insight: 1, compassion: 0 },
        express: { compassion: 1, insight: 0, courage: 0 },
        rest: { insight: 1, compassion: 0, courage: 0 },
        patience: { insight: 3, compassion: 1, courage: 0 },
        share: { compassion: 2, insight: 0, courage: 1 },
        protect: { courage: 3, compassion: 2, insight: 0 },
        teach: { insight: 2, compassion: 1, courage: 0 },
        listen: { insight: 2, compassion: 2, courage: 0 },
        mediate: { compassion: 2, insight: 2, courage: 2 },
        sacrifice: { compassion: 3, courage: 3, insight: 1 },
        anti_virtue: { compassion: -3, insight: -2, courage: -1 }
    };

    // Story situations and their conditions
    const storySituations = {
        forestBuddha: {
            requirements: {
                location: "forest_edge",
                insight: 60,
                patienceActions: 3
            },
            text: "The forest suddenly feels different - time seems to slow around you. As you sit in patient observation, a sense of profound connection washes over you. The trees, the birds, the very air seems to acknowledge your presence. In this moment, you understand something beyond words.",
            internalText: "Something has changed within me. I feel... lighter, as if a burden I didn't know I carried has been set down.",
            virtueChanges: { insight: 10, compassion: 5 },
            flag: "forestBuddhaAchieved"
        },
        silentLaborer: {
            requirements: {
                location: "farm",
                compassion: 40,
                helpActions: 2
            },
            text: "Farmer Eadric approaches you after watching your work. He gestures to a small, unused shed near the edge of his property and mimics sleeping. His weathered face shows genuine appreciation for your help.",
            internalText: "A place to rest, freely offered. Such a simple thing, yet it means everything when you're a stranger in a strange place.",
            virtueChanges: { compassion: 5 },
            flag: "shelterOffered"
        },
        sweetDreams: {
            requirements: {
                sleeplessness: 70,
                anyRelationship: 50
            },
            text: "You wake to find someone has placed a blanket over you as you slept. A small bundle of food sits nearby - a silent gift from someone who has begun to care about your wellbeing.",
            internalText: "I can't remember the last time someone looked after me while I slept. It feels... uncomfortable, yet somehow right.",
            virtueChanges: { compassion: 3 },
            flag: "receivedCare"
        },
        lostItem: {
            requirements: {
                hasItem: true,
                insight: 30
            },
            text: "You notice something that seems out of place - clearly belonging to someone in the village but left behind or lost. It would be easy to ignore, but returning it might build trust.",
            internalText: "Such a small thing, easily overlooked. Yet small things can mean so much when they're important to someone.",
            actionFlag: "foundLostItem"
        },
        brokenVow: {
            requirements: {
                combinedVirtue: 180,
                hasBrokenVow: false
            },
            occurs: false,
            text: "A moment of crisis has arrived. Your vow of silence hangs heavy on you as the situation demands immediate action. Perhaps this is the moment where words are truly needed.",
            internalText: "My throat tightens at the thought of breaking my vow. But what good is a vow if it causes harm? Sometimes the greatest virtue is knowing when to let go of rules.",
            actionFlag: "vowBreakingMoment"
        }
    };

    // Contextual actions based on location, time, NPCs present, etc.
    const contextualActions = {
        village_entrance: {
            first_visit: [
                {
                    text: "Observe the village",
                    type: "observe",
                    effect: () => {
                        updateVirtues("observe");
                        return "You stand quietly, taking in the atmosphere of the village. People move about their daily tasks, occasionally glancing your way with curious or suspicious looks. The village is small but seems largely self-sufficient.";
                    }
                },
                {
                    text: "Enter the village",
                    type: "courage",
                    effect: () => {
                        updateVirtues("courage");
                        changeLocation("village_square");
                        return "You take a deep breath and step forward, officially entering the village. A few villagers pause in their activities to watch you, but most continue with their routines.";
                    }
                },
                {
                    text: "Wait and reflect",
                    type: "patience",
                    effect: () => {
                        updateVirtues("patience");
                        return "You pause at the threshold, gathering your thoughts. Your vow of silence feels both a burden and a shield as you prepare to enter this new community.";
                    }
                },
                {
                    text: "Check your belongings",
                    type: "insight",
                    effect: () => {
                        updateVirtues("insight");
                        return "You have nothing but the clothes on your back and the weight of your vow. Whatever life you left behind, you brought nothing physical from it.";
                    }
                }
            ],
            standard: [
                {
                    text: "Observe the coming and going",
                    type: "observe",
                    effect: () => {
                        updateVirtues("observe");
                        return "You watch villagers entering and leaving, carrying goods or returning from work. The rhythm of village life is becoming more apparent to you.";
                    }
                },
                {
                    text: "Enter the village",
                    type: "normal",
                    effect: () => {
                        changeLocation("village_square");
                        return "You walk toward the center of the village, following the main path.";
                    }
                },
                {
                    text: "Sit by the roadside",
                    type: "rest",
                    effect: () => {
                        updateVirtues("rest");
                        reduceSleeplessness(10);
                        advanceTime(1);
                        return "You find a comfortable spot just off the path and sit, watching travelers come and go. The rest helps clear your mind.";
                    }
                },
                {
                    text: "Help clear the path",
                    type: "help",
                    requirements: {
                        timeOfDay: ["Morning", "Afternoon"]
                    },
                    effect: () => {
                        updateVirtues("help");
                        increaseVillageMorale(3);
                        return "You notice debris and stones cluttering the village entrance and spend time clearing the path. A few passersby nod appreciatively at your work.";
                    }
                }
            ]
        },
        village_square: {
            standard: [
                {
                    text: "Observe the square",
                    type: "observe",
                    effect: () => {
                        updateVirtues("observe");
                        return "The square is the beating heart of village life. Children play, elders chat on benches, and traders display their modest wares. You notice subtle social dynamics at play.";
                    }
                },
                {
                    text: "Sit on a bench",
                    type: "rest",
                    effect: () => {
                        updateVirtues("rest");
                        reduceSleeplessness(5);
                        advanceTime(1);
                        return "You find an empty bench and sit, taking in the sights and sounds of the village center. After a while, people seem to grow more accustomed to your presence.";
                    }
                },
                {
                    text: "Help an elderly villager",
                    type: "help",
                    requirements: {
                        random: 0.6 // 60% chance this appears
                    },
                    effect: () => {
                        updateVirtues("help");
                        increaseVillageMorale(2);
                        increaseNPCRelationship("elder", 3);
                        return "You notice an elderly person struggling with their packages. Without a word, you step forward and offer assistance, receiving a grateful smile in return.";
                    }
                },
                {
                    text: "Smile at a passing child",
                    type: "express",
                    effect: () => {
                        updateVirtues("express");
                        if (Math.random() > 0.7) {
                            increaseNPCRelationship("child", 2);
                            return "You smile gently at a passing child. After a moment of shy hesitation, they smile back, their curiosity piqued by the silent stranger.";
                        } else {
                            return "You smile at a passing child, but they quickly hide behind their parent, regarding you with cautious eyes.";
                        }
                    }
                }
            ]
        },
        // More locations and actions would be defined similarly...
    };

    // Standard actions available in most situations
    const standardActions = {
        observe: {
            text: "Observe carefully",
            type: "observe",
            effect: () => {
                updateVirtues("observe");
                const insightBonus = Math.floor(gameState.insight / 20); // 0-5 bonus based on current Insight
                const perceptionDetail = getPerceptionDetail(gameState.insight);
                
                // Check for village challenge signs if insight is high enough
                if (gameState.insight >= gameState.villageChallenge.insightThreshold && !gameState.storyFlags.challengeNoticed) {
                    gameState.storyFlags.challengeNoticed = true;
                    return `As you observe your surroundings, ${perceptionDetail} ${gameState.villageChallenge.signs[Math.floor(Math.random() * gameState.villageChallenge.signs.length)]}. This seems significant.`;
                }
                
                return `You take a moment to carefully observe your surroundings. ${perceptionDetail} You notice details that might have otherwise escaped your attention.`;
            }
        },
        wait: {
            text: "Wait patiently",
            type: "patience",
            effect: () => {
                updateVirtues("patience");
                advanceTime(1);
                increaseNPCRelationship(getRandomNPC(), 1); // Patience slightly improves a random relationship
                
                return "You stand quietly, practicing patience. The world continues around you, and there's a certain peace in simply being present without acting.";
            }
        },
        move: {
            text: "Go elsewhere",
            type: "normal",
            effect: () => {
                // Will be handled by the UI to show location options
                return "You decide to move to another location.";
            }
        },
        rest: {
            text: "Rest a while",
            type: "rest",
            effect: () => {
                updateVirtues("rest");
                reduceSleeplessness(15);
                advanceTime(1);
                
                return "You find a comfortable spot and allow yourself to rest. Your body relaxes, and your mind clears somewhat.";
            }
        }
    };

    // Utility Functions
    function getRandomNPC() {
        const npcKeys = Object.keys(npcs);
        return npcKeys[Math.floor(Math.random() * npcKeys.length)];
    }

    function getPerceptionDetail(insight) {
        if (insight < 30) {
            return "You see the obvious details.";
        } else if (insight < 50) {
            return "You notice subtle movements and expressions.";
        } else if (insight < 70) {
            return "Your keen observation reveals hidden patterns and unspoken tensions.";
        } else {
            return "With remarkable clarity, you perceive the intricate web of relationships and emotions.";
        }
    }

    function updateVirtues(actionType) {
        if (!actionEffects[actionType]) return;
        
        const effects = actionEffects[actionType];
        gameState.compassion = Math.max(0, Math.min(100, gameState.compassion + effects.compassion));
        gameState.insight = Math.max(0, Math.min(100, gameState.insight + effects.insight));
        gameState.courage = Math.max(0, Math.min(100, gameState.courage + effects.courage));
        
        // Update daily virtue changes for the log
        gameState.dailyVirtueChanges.compassion += effects.compassion;
        gameState.dailyVirtueChanges.insight += effects.insight;
        gameState.dailyVirtueChanges.courage += effects.courage;
        
        // Update perception score based on virtue changes
        if (effects.compassion > 0 || effects.insight > 0 || effects.courage > 0) {
            gameState.perceptionScore += (effects.compassion + effects.insight + effects.courage) / 3;
        } else {
            gameState.perceptionScore += (effects.compassion + effects.insight + effects.courage) / 2; // Negative actions hurt perception more
        }
        
        updateTextStyles();
    }

    function updateTextStyles() {
        const totalVirtue = gameState.compassion + gameState.insight + gameState.courage;
        
        // Remove all virtue classes
        narrativeText.classList.remove('low-virtue', 'medium-virtue', 'high-virtue');
        internalMonologue.classList.remove('low-virtue', 'medium-virtue', 'high-virtue');
        
        // Add appropriate class based on total virtue
        if (totalVirtue < 90) {
            narrativeText.classList.add('low-virtue');
            internalMonologue.classList.add('low-virtue');
        } else if (totalVirtue < 180) {
            narrativeText.classList.add('medium-virtue');
            internalMonologue.classList.add('medium-virtue');
        } else {
            narrativeText.classList.add('high-virtue');
            internalMonologue.classList.add('high-virtue');
        }
        
        // Update location image saturation based on village morale
        const saturation = 20 + (gameState.villageMorale * 0.8); // 20-100%
        locationImage.style.filter = `saturate(${saturation}%)`;
    }

    function increaseVillageMorale(amount) {
        gameState.villageMorale = Math.min(100, gameState.villageMorale + amount);
    }

    function decreaseVillageMorale(amount) {
        gameState.villageMorale = Math.max(0, gameState.villageMorale - amount);
    }

    function increaseNPCRelationship(npc, amount) {
        if (gameState.npcRelationships[npc] !== undefined) {
            gameState.npcRelationships[npc] = Math.min(100, gameState.npcRelationships[npc] + amount);
        }
    }

    function decreaseNPCRelationship(npc, amount) {
        if (gameState.npcRelationships[npc] !== undefined) {
            gameState.npcRelationships[npc] = Math.max(-100, gameState.npcRelationships[npc] - amount);
        }
    }

    function increaseSleeplessness(amount) {
        gameState.sleeplessness = Math.min(100, gameState.sleeplessness + amount);
        checkForHallucinations();
    }

    function reduceSleeplessness(amount) {
        gameState.sleeplessness = Math.max(0, gameState.sleeplessness - amount);
    }

    function checkForHallucinations() {
        if (gameState.sleeplessness > 70 && Math.random() < 0.3) {
            // Trigger a hallucination
            const hallucinations = [
                "For a moment, the world shifts around you. You see a familiar face in the crowd, but when you look again, they're gone.",
                "Your vision blurs, and you suddenly recall a fragment of memory - voices arguing, a decision made in anger.",
                "The ground seems to sway beneath your feet, and you hear distant whispers calling your name.",
                "You blink, and for an instant, your hands appear covered in something dark. When you look again, they're clean."
            ];
            
            updateNarrativeText(hallucinations[Math.floor(Math.random() * hallucinations.length)]);
            updateInternalMonologue("My mind is playing tricks on me. I need to rest soon.");
        }
        
        if (gameState.sleeplessness >= 100) {
            // Force sleep
            updateNarrativeText("Exhaustion finally overwhelms you. Your vision darkens as you collapse, consciousness slipping away.");
            updateInternalMonologue("I can't... stay... awake...");
            
            // Advance time and reduce sleeplessness
            advanceTime(2); // Force advance 2 time units
            reduceSleeplessness(70);
            
            // Potential negative consequences
            decreaseVillageMorale(5);
            Object.keys(gameState.npcRelationships).forEach(npc => {
                decreaseNPCRelationship(npc, 2);
            });
        }
    }

    function advanceTime(units = 1) {
        for (let i = 0; i < units; i++) {
            gameState.timeUnit++;
            
            // Next day if we've gone through all time units
            if (gameState.timeUnit > 3) {
                endDay();
                gameState.timeUnit = 0;
                gameState.day++;
                
                if (gameState.day > 7) {
                    endGame();
                    return;
                }
                
                startNewDay();
            }
            
            // Update time display
            timeDisplay.textContent = gameState.timeUnits[gameState.timeUnit];
            dayDisplay.textContent = `Day ${gameState.day}`;
            
            // Increase sleeplessness normally through day
            if (gameState.timeUnit !== 0) { // Not morning
                increaseSleeplessness(5);
            }
        }
    }

    function changeLocation(newLocation) {
        if (!locations[newLocation]) return;
        
        gameState.location = newLocation;
        
        // Update location display
        locationImage.style.backgroundImage = locations[newLocation].image;
        
        // First visit special handling
        if (locations[newLocation].firstVisit) {
            locations[newLocation].firstVisit = false;
            updateNarrativeText(`${locations[newLocation].description} This is your first time here.`);
        } else {
            updateNarrativeText(locations[newLocation].description);
        }
        
        // Check for NPCs in this location
        checkForNPCEncounters();
        
        // Update available actions based on new location
        updateAvailableActions();
    }

    function checkForNPCEncounters() {
        // Check which NPCs are at this location for this time of day
        const presentNPCs = [];
        
        Object.keys(npcs).forEach(npcKey => {
            const npc = npcs[npcKey];
            const currentTimeUnit = gameState.timeUnits[gameState.timeUnit];
            
            if (npc.schedule[currentTimeUnit] === gameState.location) {
                presentNPCs.push(npcKey);
            }
        });
        
        // If there are NPCs present, maybe trigger an encounter
        if (presentNPCs.length > 0 && Math.random() < 0.7) {
            const randomNPC = presentNPCs[Math.floor(Math.random() * presentNPCs.length)];
            triggerNPCEncounter(randomNPC);
        }
    }

    function triggerNPCEncounter(npcKey) {
        const npc = npcs[npcKey];
        const relationship = gameState.npcRelationships[npcKey];
        
        // Different interactions based on relationship level
        let encounterText = "";
        
        if (relationship < -50) {
            encounterText = `${npc.name} sees you and deliberately changes direction, avoiding your presence.`;
        } else if (relationship < 0) {
            encounterText = `${npc.name} gives you a wary glance, clearly still unsure about your presence in the village.`;
        } else if (relationship < 30) {
            encounterText = `${npc.name} acknowledges you with a small nod, neither friendly nor hostile.`;
        } else if (relationship < 70) {
            encounterText = `${npc.name} offers you a genuine smile of greeting as your paths cross.`;
        } else {
            encounterText = `${npc.name}'s face brightens upon seeing you, and they approach with warm familiarity.`;
        }
        
        updateNarrativeText(encounterText);
    }

    function addItemToInventory(itemName) {
        // Can only hold 2 items
        if (gameState.items.length >= 2) {
            updateNarrativeText("You cannot carry any more items. You must drop something first.");
            return false;
        }
        
        // Find the item
        const item = gameItems.find(i => i.name === itemName);
        if (!item) return false;
        
        // Add it
        gameState.items.push(itemName);
        
        // Show notification
        itemMessage.textContent = `Item acquired: ${itemName}`;
        itemNotification.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            itemNotification.classList.add('hidden');
        }, 3000);
        
        // Check for combinable items
        checkForCombinableItems();
        
        return true;
    }

    function removeItemFromInventory(itemName) {
        const index = gameState.items.indexOf(itemName);
        if (index > -1) {
            gameState.items.splice(index, 1);
            return true;
        }
        return false;
    }

    function checkForCombinableItems() {
        if (gameState.items.length !== 2) return false;
        
        // Check if these items can be combined
        const item1 = gameItems.find(i => i.name === gameState.items[0]);
        const item2 = gameItems.find(i => i.name === gameState.items[1]);
        
        if (item1 && item2 && item1.combinable && item2.combinable) {
            if (item1.comboPartner === item2.name || item2.comboPartner === item1.name) {
                // These items can be combined!
                if (gameState.insight >= 50) {
                    updateInternalMonologue("I wonder if these two items could be used together somehow...");
                    return true;
                }
            }
        }
        
        return false;
    }

    function combineItems() {
        const itemCombo = gameState.items.sort().join("+");
        const combinedItem = combinedItems[itemCombo];
        
        if (!combinedItem) return false;
        
        // Remove the original items
        gameState.items = [];
        
        // Add the new combined item
        gameState.items.push(combinedItem.name);
        
        // Show notification
        itemMessage.textContent = `Created: ${combinedItem.name}`;
        itemNotification.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            itemNotification.classList.add('hidden');
        }, 3000);
        
        return true;
    }

    function updateNarrativeText(text) {
        narrativeText.innerHTML = text;
    }

    function updateInternalMonologue(text) {
        internalMonologue.innerHTML = text;
    }

    function updateAvailableActions() {
        // Get contextual actions for current location
        const locationActions = contextualActions[gameState.location];
        let availableActions = [];
        
        // Add location-specific actions
        if (locationActions) {
            if (locations[gameState.location].firstVisit && locationActions.first_visit) {
                availableActions = [...locationActions.first_visit];
            } else if (locationActions.standard) {
                // Filter standard actions based on requirements
                availableActions = locationActions.standard.filter(action => {
                    if (!action.requirements) return true;
                    
                    // Check time of day requirement
                    if (action.requirements.timeOfDay && !action.requirements.timeOfDay.includes(gameState.timeUnits[gameState.timeUnit])) {
                        return false;
                    }
                    
                    // Check random chance
                    if (action.requirements.random && Math.random() > action.requirements.random) {
                        return false;
                    }
                    
                    return true;
                });
            }
        }
        
        // Add standard actions
        const standardActionsList = Object.values(standardActions);
        
        // Prioritize interesting contextual actions
        while (availableActions.length < 4 && standardActionsList.length > 0) {
            const randomIndex = Math.floor(Math.random() * standardActionsList.length);
            availableActions.push(standardActionsList[randomIndex]);
            standardActionsList.splice(randomIndex, 1);
        }
        
        // Shuffle and limit to 4 actions
        availableActions = shuffleArray(availableActions).slice(0, 4);
        
        // Update button text and handlers
        actionButtons.forEach((button, index) => {
            if (index < availableActions.length) {
                button.textContent = availableActions[index].text;
                button.onclick = () => {
                    handleAction(availableActions[index]);
                };
                button.disabled = false;
            } else {
                button.textContent = "";
                button.onclick = null;
                button.disabled = true;
            }
        });
    }

    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    function handleAction(action) {
        // Disable buttons during action processing
        actionButtons.forEach(button => {
            button.disabled = true;
        });
        
        // Special handling for "move" action
        if (action.text === "Go elsewhere") {
            showLocationOptions();
            return;
        }
        
        // Execute the action effect
        const result = action.effect();
        
        // Update narrative text with the result
        updateNarrativeText(result);
        
        // Update internal monologue based on virtue levels and action type
        updateRandomInternalMonologue(action.type);
        
        // Re-enable buttons and update available actions after a short delay
        setTimeout(() => {
            actionButtons.forEach(button => {
                button.disabled = false;
            });
            updateAvailableActions();
        }, 1500);
    }

    function updateRandomInternalMonologue(actionType) {
        const totalVirtue = gameState.compassion + gameState.insight + gameState.courage;
        
        const lowVirtueThoughts = [
            "Why am I even doing this? These people don't care about me.",
            "This silence is maddening. What's the point of any of this?",
            "I feel empty, like my actions mean nothing.",
            "I could just leave. No one would notice or care."
        ];
        
        const mediumVirtueThoughts = [
            "There's something to be learned here, if I'm patient enough.",
            "Words aren't always necessary. Sometimes action is enough.",
            "This village has its own rhythm. I'm beginning to understand it.",
            "My past doesn't define me. My actions here do."
        ];
        
        const highVirtueThoughts = [
            "Every small act of kindness ripples outward in ways we can't see.",
            "In silence, I hear truths that words often obscure.",
            "There's a profound peace in simply being present, here and now.",
            "The path to redemption isn't a straight line, but I'm finding my way."
        ];
        
        let thoughtPool;
        if (totalVirtue < 90) {
            thoughtPool = lowVirtueThoughts;
        } else if (totalVirtue < 180) {
            thoughtPool = mediumVirtueThoughts;
        } else {
            thoughtPool = highVirtueThoughts;
        }
        
        // Sometimes add thoughts related to sleeplessness
        if (gameState.sleeplessness > 50 && Math.random() < 0.3) {
            updateInternalMonologue("My thoughts are foggy. I need to rest soon before exhaustion overtakes me.");
            return;
        }
        
        // Action-specific thoughts override random ones sometimes
        if (actionType === "help" && Math.random() < 0.5) {
            updateInternalMonologue("Helping feels... right. Maybe this is part of why I'm here.");
            return;
        }
        
        if (actionType === "observe" && gameState.insight > 50) {
            updateInternalMonologue("I'm seeing patterns now that were invisible to me before. My silence has sharpened my other senses.");
            return;
        }
        
        updateInternalMonologue(thoughtPool[Math.floor(Math.random() * thoughtPool.length)]);
    }

    function showLocationOptions() {
        // Clear current buttons
        actionButtons.forEach(button => {
            button.textContent = "";
            button.onclick = null;
        });
        
        // Get nearby locations
        const nearbyLocations = {
            village_entrance: ["village_square", "forest_edge"],
            village_square: ["village_entrance", "inn", "elder_home", "farm", "healers_hut"],
            inn: ["village_square"],
            healers_hut: ["village_square", "forest_edge"],
            elder_home: ["village_square"],
            farm: ["village_square", "river"],
            forest_edge: ["village_entrance", "healers_hut", "river"],
            river: ["farm", "forest_edge"]
        };
        
        const options = nearbyLocations[gameState.location] || [];
        
        // Update narrative text
        updateNarrativeText("Where would you like to go?");
        
        // Update buttons with location options
        options.forEach((location, index) => {
            if (index < actionButtons.length) {
                actionButtons[index].textContent = locations[location].name;
                actionButtons[index].onclick = () => {
                    changeLocation(location);
                };
                actionButtons[index].disabled = false;
            }
        });
        
        // Add "Stay here" option to the last button
        const lastButtonIndex = Math.min(options.length, actionButtons.length - 1);
        actionButtons[lastButtonIndex].textContent = "Stay here";
        actionButtons[lastButtonIndex].onclick = () => {
            updateNarrativeText("You decide to remain where you are for now.");
            updateAvailableActions();
        };
    }

    function endDay() {
        // Log the day's activities
        gameState.logEntries.push({
            day: gameState.day,
            virtueChanges: { ...gameState.dailyVirtueChanges }
        });
        
        // Reset daily virtue changes
        gameState.dailyVirtueChanges = {
            compassion: 0,
            insight: 0,
            courage: 0
        };
        
        // Update log display
        updateLogDisplay();
        
        // Special handling for excessive sleeplessness at day end
        if (gameState.sleeplessness > 80) {
            reduceSleeplessness(30); // Forced rest overnight
            updateNarrativeText("Exhaustion claims you as night falls. Your sleep is troubled by strange dreams and fragments of memory.");
        } else {
            reduceSleeplessness(20); // Normal overnight recovery
        }
    }

    function startNewDay() {
        // Update day display
        dayDisplay.textContent = `Day ${gameState.day}`;
        timeDisplay.textContent = gameState.timeUnits[gameState.timeUnit];
        
        // Reset NPC moods
        Object.keys(gameState.npcMoods).forEach(npc => {
            const moodOptions = ["happy", "neutral", "irritable", "thoughtful", "sad"];
            gameState.npcMoods[npc] = moodOptions[Math.floor(Math.random() * moodOptions.length)];
        });
        
        // New day message
        if (gameState.day === 7) {
// New day message
        if (gameState.day === 7) {
            updateNarrativeText("You wake to the dawn of your seventh and final day in the village. There's a weight to the air, a sense that choices made today will shape your ultimate legacy here.");
            updateInternalMonologue("My time here draws to a close. What mark will I leave on this place? And what will it leave on me?");
        } else {
            updateNarrativeText(`A new day dawns in the village. You wake to the sounds of early morning activity as the village comes to life for Day ${gameState.day}.`);
            
            // Dynamic internal monologue based on progress
            if (gameState.villageMorale < 30) {
                updateInternalMonologue("There's a heaviness in the air. My presence here doesn't seem to be helping.");
            } else if (gameState.villageMorale > 70) {
                updateInternalMonologue("There's a warmth in the way people move today. Perhaps I'm making a difference here.");
            } else {
                updateInternalMonologue("Another day of silence stretches before me. What will I learn today?");
            }
        }
        
        // Check for special events
        checkForSpecialEvents();
        
        // Move to morning position (usually home base or village square)
        changeLocation("village_square");
    }

    function checkForSpecialEvents() {
        // Check each story situation to see if conditions are met
        Object.keys(storySituations).forEach(key => {
            const situation = storySituations[key];
            
            // Skip if this situation has already occurred
            if (gameState.storyFlags[situation.flag]) return;
            
            // Check requirements
            let requirementsMet = true;
            
            if (situation.requirements.location && gameState.location !== situation.requirements.location) {
                requirementsMet = false;
            }
            
            if (situation.requirements.insight && gameState.insight < situation.requirements.insight) {
                requirementsMet = false;
            }
            
            if (situation.requirements.compassion && gameState.compassion < situation.requirements.compassion) {
                requirementsMet = false;
            }
            
            if (situation.requirements.courage && gameState.courage < situation.requirements.courage) {
                requirementsMet = false;
            }
            
            if (situation.requirements.combinedVirtue && 
                (gameState.compassion + gameState.insight + gameState.courage) < situation.requirements.combinedVirtue) {
                requirementsMet = false;
            }
            
            if (situation.requirements.sleeplessness && gameState.sleeplessness < situation.requirements.sleeplessness) {
                requirementsMet = false;
            }
            
            if (situation.requirements.hasItem && gameState.items.length === 0) {
                requirementsMet = false;
            }
            
            if (situation.requirements.anyRelationship) {
                let maxRelationship = -100;
                Object.values(gameState.npcRelationships).forEach(value => {
                    maxRelationship = Math.max(maxRelationship, value);
                });
                
                if (maxRelationship < situation.requirements.anyRelationship) {
                    requirementsMet = false;
                }
            }
            
            // Trigger the situation if all requirements are met
            if (requirementsMet && (!situation.occurs || situation.occurs === true)) {
                triggerSpecialEvent(key);
                
                // Mark as occurred
                gameState.storyFlags[situation.flag] = true;
                
                // Apply virtue changes
                if (situation.virtueChanges) {
                    if (situation.virtueChanges.compassion) {
                        gameState.compassion = Math.max(0, Math.min(100, gameState.compassion + situation.virtueChanges.compassion));
                        gameState.dailyVirtueChanges.compassion += situation.virtueChanges.compassion;
                    }
                    
                    if (situation.virtueChanges.insight) {
                        gameState.insight = Math.max(0, Math.min(100, gameState.insight + situation.virtueChanges.insight));
                        gameState.dailyVirtueChanges.insight += situation.virtueChanges.insight;
                    }
                    
                    if (situation.virtueChanges.courage) {
                        gameState.courage = Math.max(0, Math.min(100, gameState.courage + situation.virtueChanges.courage));
                        gameState.dailyVirtueChanges.courage += situation.virtueChanges.courage;
                    }
                }
            }
        });
    }

    function triggerSpecialEvent(situationKey) {
        const situation = storySituations[situationKey];
        
        updateNarrativeText(situation.text);
        updateInternalMonologue(situation.internalText);
        
        // Special handling for specific events
        if (situationKey === "brokenVow") {
            offerVowBreakingChoice();
        }
    }

    function offerVowBreakingChoice() {
        // Disable normal actions
        actionButtons.forEach(button => {
            button.disabled = true;
        });
        
        // Create specific choices for this moment
        actionButtons[0].textContent = "Break your vow and speak";
        actionButtons[0].onclick = () => {
            breakVow();
        };
        actionButtons[0].disabled = false;
        
        actionButtons[1].textContent = "Maintain your silence";
        actionButtons[1].onclick = () => {
            maintainVow();
        };
        actionButtons[1].disabled = false;
    }

    function breakVow() {
        gameState.hasBrokenVow = true;
        
        // Determine if this was a good or bad time to break the vow
        const totalVirtue = gameState.compassion + gameState.insight + gameState.courage;
        
        if (totalVirtue > 200) {
            // Good outcome
            updateNarrativeText("Your voice emerges, rough with disuse but firm with conviction. The simple truth you speak seems to hang in the air, powerful in its rarity. The effect is immediate and profound.");
            updateInternalMonologue("There is a time for silence and a time for speech. I chose well.");
            
            // Positive effects
            gameState.compassion = 100;
            increaseVillageMorale(20);
            Object.keys(gameState.npcRelationships).forEach(npc => {
                increaseNPCRelationship(npc, 15);
            });
        } else {
            // Negative outcome
            updateNarrativeText("Words spill from your lips, breaking your sacred vow. In the moment of crisis, your voice fails you, coming out wrong, conveying the opposite of your intention. The damage is immediate and obvious.");
            updateInternalMonologue("I broke my vow for nothing. The weight of this failure is crushing.");
            
            // Negative effects
            gameState.compassion -= 15;
            gameState.insight -= 10;
            decreaseVillageMorale(15);
            Object.keys(gameState.npcRelationships).forEach(npc => {
                decreaseNPCRelationship(npc, 10);
            });
        }
        
        // After a delay, restore normal gameplay
        setTimeout(() => {
            updateAvailableActions();
        }, 3000);
    }

    function maintainVow() {
        updateNarrativeText("Despite the overwhelming urge to speak, you maintain your vow of silence. You find other ways to communicate what needs to be said - through gesture, expression, and meaningful action.");
        updateInternalMonologue("The hardest silence to maintain is often the most meaningful. I remain true to my path.");
        
        // Positive effects for maintaining discipline
        gameState.insight += 10;
        gameState.courage += 5;
        
        // After a delay, restore normal gameplay
        setTimeout(() => {
            updateAvailableActions();
        }, 3000);
    }

    function updateLogDisplay() {
        // Clear previous log entries
        logEntries.innerHTML = '';
        
        // Add each log entry
        gameState.logEntries.forEach(entry => {
            const logDiv = document.createElement('div');
            logDiv.className = 'log-entry';
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'log-day';
            dayDiv.textContent = `Day ${entry.day}`;
            logDiv.appendChild(dayDiv);
            
            // Add virtue changes
            if (entry.virtueChanges.compassion !== 0) {
                const compassionDiv = document.createElement('div');
                compassionDiv.className = `virtue-change ${entry.virtueChanges.compassion > 0 ? 'positive' : 'negative'}`;
                compassionDiv.textContent = `Compassion: ${entry.virtueChanges.compassion > 0 ? '+' : ''}${entry.virtueChanges.compassion}`;
                logDiv.appendChild(compassionDiv);
            }
            
            if (entry.virtueChanges.insight !== 0) {
                const insightDiv = document.createElement('div');
                insightDiv.className = `virtue-change ${entry.virtueChanges.insight > 0 ? 'positive' : 'negative'}`;
                insightDiv.textContent = `Insight: ${entry.virtueChanges.insight > 0 ? '+' : ''}${entry.virtueChanges.insight}`;
                logDiv.appendChild(insightDiv);
            }
            
            if (entry.virtueChanges.courage !== 0) {
                const courageDiv = document.createElement('div');
                courageDiv.className = `virtue-change ${entry.virtueChanges.courage > 0 ? 'positive' : 'negative'}`;
                courageDiv.textContent = `Courage: ${entry.virtueChanges.courage > 0 ? '+' : ''}${entry.virtueChanges.courage}`;
                logDiv.appendChild(courageDiv);
            }
            
            logEntries.appendChild(logDiv);
        });
    }

function endGame() {
        gameState.gameEnded = true;
        
        // Determine ending based on final state
        let endingText = "";
        const totalVirtue = gameState.compassion + gameState.insight + gameState.courage;
        
        if (totalVirtue > 250 && gameState.villageMorale > 80) {
            // Best ending
            endingText = "Your week of silence ends in a ceremony led by Elder Thaddeus. The entire village gathers, offering heartfelt gifts and tokens of respect. As you prepare to leave, a rare offer is made - a place among them, should you ever wish to return. Though your vow of silence ends today, the lessons learned will speak within you forever.";
        } else if (totalVirtue > 200 || gameState.villageMorale > 70) {
            // Good ending
            endingText = "As your time in the village comes to a close, you find yourself changed. The silent days have given you perspective, and your actions have left the village better than you found it. Whatever path led you here, you now walk forward with greater purpose and peace.";
        } else if (totalVirtue > 120 || gameState.villageMorale > 40) {
            // Neutral ending
            endingText = "Your week of silence comes to a quiet end. Some villagers bid you farewell, while others merely observe your departure. The experience has taught you something, though what lessons you'll carry forward remains to be seen.";
        } else {
            // Bad ending
            endingText = "You slip away from the village before dawn on the seventh day, leaving as quietly as you arrived. Your presence brought little comfort to this place, and your vow of silence feels more like a burden than a path to wisdom. Perhaps redemption awaits elsewhere.";
        }
        
        // Display ending
        endingText += `\n\nCompassion: ${gameState.compassion}/100\nInsight: ${gameState.insight}/100\nCourage: ${gameState.courage}/100\nVillage Morale: ${gameState.villageMorale}%`;
        
        endingText = endingText.replace(/\n/g, '<br>');
        endingText.textContent = endingText;
        
        endingScreen.classList.remove('hidden');
    }

    // Event Listeners - FIXED VERSION
    if (startGameButton) {
        console.log("Adding click listener to start button");
        startGameButton.addEventListener('click', function() {
            console.log("Start button clicked!");
            introScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            // Initialize game
            initializeGame();
        });
    } else {
        console.error("Start button not found!");
    }

    if (logButton) {
        logButton.addEventListener('click', () => {
            logModal.classList.remove('hidden');
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            logModal.classList.add('hidden');
        });
    }

    if (playAgainButton) {
        playAgainButton.addEventListener('click', () => {
            endingScreen.classList.add('hidden');
            introScreen.classList.remove('hidden');
            gameContainer.classList.add('hidden');
        });
    }

    // Initialize the game
    function initializeGame() {
        // Reset game state
        gameState = {
            day: 1,
            timeUnit: 0,
            timeUnits: ['Morning', 'Afternoon', 'Evening', 'Night'],
            location: 'village_entrance',
            
            compassion: 20,
            insight: 20,
            courage: 20,
            perceptionScore: 15,
            sleeplessness: 0,
            
            items: [],
            learnedGestures: [],
            
            villageMorale: 50,
            npcRelationships: {
                elder: 0,
                innkeeper: 0,
                healer: 0,
                farmer: 0,
                child: 0
            },
            npcMoods: {
                elder: 'neutral',
                innkeeper: 'neutral',
                healer: 'neutral',
                farmer: 'neutral',
                child: 'neutral'
            },
            
            logEntries: [],
            hasBrokenVow: false,
            gameEnded: false,
            
            dailyVirtueChanges: {
                compassion: 0,
                insight: 0,
                courage: 0
            },
            
            storyFlags: {}
        };
        
        // Reset location first visits
        Object.keys(locations).forEach(key => {
            locations[key].firstVisit = true;
        });
        
        // Choose a random village challenge
        gameState.villageChallenge = villageChallenges[Math.floor(Math.random() * villageChallenges.length)];
        
        // Update displays
        dayDisplay.textContent = `Day ${gameState.day}`;
        timeDisplay.textContent = gameState.timeUnits[gameState.timeUnit];
        
        // Start at village entrance
        changeLocation('village_entrance');
        
        // First-time game message
        updateNarrativeText("A weathered wooden sign marks the entrance to the small village. Dirt paths wind between modest cottages, smoke curling from their chimneys. The sounds of daily life echo in the distance.");
        updateInternalMonologue("My vow of silence weighs heavily, but it's a burden I've chosen to bear. Perhaps in this place, I'll find what I'm seeking.");
    }

    // Note: We don't need to initialize the game here as that's handled by the start button event
}); // This closes the DOMContentLoaded event listener