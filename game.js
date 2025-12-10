// --- CANVAS & CONTEXT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GUI ELEMENTS ---
const startScreen = document.getElementById('startScreen');
const pauseMenu = document.getElementById('pauseMenu');
const endScreen = document.getElementById('endScreen');
const creditsScreen = document.getElementById('creditsScreen');
const endText = document.getElementById('endText');

// --- TOUCH/MOBILE VARIABLES ---
let touchX = null; 
let touchActive = false;

// --- RESIZE FUNCTION ---
function resizeCanvas() {
    // If screen is wider than 600px, constrain the canvas width to 600px
    if (window.innerWidth > 600) {
        canvas.width = 600;
    } else {
        canvas.width = window.innerWidth;
    }
    // Canvas height is always full height
    canvas.height = window.innerHeight;
    
    // Initialize stars only on first load
    if (stars.length === 0) initializeStars();
}
window.addEventListener('resize', resizeCanvas);


// --- STARFIELD (VOID ENVIRONMENT) ---
let stars = [];
const STAR_COUNT = 150;
const STAR_SPEED = 0.5;

function initializeStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * STAR_SPEED + 0.1
        });
    }
}

function updateStars() {
    for (let i = 0; i < stars.length; i++) {
        stars[i].y += stars[i].speed;
        if (stars[i].y > canvas.height) {
            stars[i].y = 0;
            stars[i].x = Math.random() * canvas.width;
        }
    }
}

function drawStars() {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

// --- GAME CONSTANTS ---
const pickupDetails = {
    'health': { assetKey: 'pickup_health', size: 40, type: 'health' },
    'fireRate': { assetKey: 'pickup_firerate', size: 40, type: 'fireRate' },
    'speed': { assetKey: 'pickup_speed', size: 40, type: 'speed' }
};
const enemyBulletMapping = {
    'fighter': { assetKey: 'bullet_zapper', size: 10, speed: 3.5 },
    'scout':   { assetKey: 'bullet_zapper', size: 10, speed: 3.5 },
    'frigate':       { assetKey: 'bullet_bigspace', size: 10, speed: 3 },
    'torpedo_ship':  { assetKey: 'bullet_bigspace', size: 10, speed: 3 },
    'battlecruiser': { assetKey: 'bullet_rocket', size: 15, speed: 2 },
    'dreadnought':   { assetKey: 'bullet_rocket', size: 15, speed: 2 }
};
const enemyTypes = {
    'fighter':       { size: 75, maxHealth: 1, speed: 1.5, color: '#f00', score: 10, shootChance: 0.005, image: 'fighter' },
    'scout':         { size: 85, maxHealth: 2, speed: 1.2, color: '#ff4500', score: 20, shootChance: 0.003, image: 'scout' },
    'frigate':       { size: 100, maxHealth: 4, speed: 0.8, color: '#f80', score: 40, shootChance: 0.005, image: 'frigate' },
    'torpedo_ship':  { size: 100, maxHealth: 3, speed: 0.6, color: '#f0f', score: 50, shootChance: 0.008, image: 'torpedo_ship' },
    'battlecruiser': { size: 135, maxHealth: 8, speed: 0.5, color: '#00f', score: 80, shootChance: 0.003, image: 'battlecruiser' },
    'dreadnought':   { size: 175, maxHealth: 12, speed: 0.3, color: '#800080', score: 120, shootChance: 0.001, image: 'dreadnought' }
};
const BASE_GUN_DETAILS = [
    { name: "Zapper", damage: 1, color: '#ff0', delay: 250, count: 1, spread: 0, size: 10, speed: 7, assetKey: 'bullet_zapper', isRocket: false }, 
    { name: "Rocket", damage: 3, color: '#ff4500', delay: 500, count: 1, spread: 0, size: 30, speed: 5, assetKey: 'bullet_rocket', isRocket: true }, 
    { name: "BigSpaceGun", damage: 1, color: '#f0f', delay: 300, count: 3, spread: 15, size: 10, speed: 7, assetKey: 'bullet_bigspace', isRocket: false }, 
    { name: "AutoCannon", damage: 2, color: '#00ffff', delay: 100, count: 2, spread: 5, size: 10, speed: 8, assetKey: 'bullet_autocannon', isRocket: false } 
];

let gunDetails = JSON.parse(JSON.stringify(BASE_GUN_DETAILS));
const BOSS_SCORE_THRESHOLD = 500; 
const bossDetails = { size: 250, maxHealth: 150, speed: 0.5, color: '#c0c', score: 1000, shootInterval: 500, lastShotTime: 0 };
const ENEMY_SPAWN_INTERVAL = 4000; 

// --- IMAGE ASSETS ---
const assets = {};

function loadImages(callback) {
    let loadedCount = 0;
    const imagesToLoad = [
        { name: 'pickup_health', file: 'pickup_health.png' },
        { name: 'pickup_firerate', file: 'pickup_firerate.png' },
        { name: 'pickup_speed', file: 'pickup_speed.png' },
        { name: 'player', file: 'player_ship.png' },
        { name: 'boss', file: 'boss.png' },
        { name: 'bullet_zapper', file: 'gun_zapper.png' },
        { name: 'bullet_rocket', file: 'gun_rocket.png' },
        { name: 'bullet_bigspace', file: 'gun_bigspace.png' },
        { name: 'bullet_autocannon', file: 'gun_autocannon.png' },
        { name: 'fighter', file: 'enemy_fighter.png' },
        { name: 'scout', file: 'enemy_scout.png' },
        { name: 'frigate', file: 'enemy_frigate.png' },
        { name: 'torpedo_ship', file: 'enemy_torpedoship.png' },
        { name: 'battlecruiser', file: 'enemy_battlecruiser.png' },
        { name: 'dreadnought', file: 'enemy_dreadnought.png' }
    ];

    imagesToLoad.forEach(item => {
        assets[item.name] = new Image();
        const fullPath = 'assets/' + item.file; 
        
        assets[item.name].onload = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) { callback(); }
        };
        assets[item.name].onerror = () => {
            console.error(`FAILED TO LOAD: ${fullPath}. Check path and spelling in the 'assets' folder!`);
            loadedCount++;
            if (loadedCount === imagesToLoad.length) { callback(); }
        };
        assets[item.name].src = fullPath;
    });
}


// --- GAME VARIABLES (Initial State) ---
function getInitialState() {
    return {
        player: {
            x: canvas.width / 2,
            y: canvas.height - 100, 
            size: 100, 
            speed: 8, 
            baseSpeed: 8, 
            canShoot: true, 
            health: 5,        
            invulnerable: false,
            currentGunIndex: 0,     
            collectedGuns: [0, 1, 2, 3], 
            maxHealth: 5, 
            fireRateBoostTimeout: null,
            speedBoostTimeout: null
        },
        bullets: [],      
        enemies: [],      
        enemyBullets: [], 
        pickups: [],      
        explosions: [], // NEW: Explosion array
        score: 0,
        boss: null,
        isBossActive: false,
        gameRunning: false, 
        gameState: 'startScreen' 
    };
}

let gameStateVars = getInitialState();
let keys = {};
let enemyInterval; 

// --- STATE HANDLERS & RESET ---

function updateState(newState) {
    Object.assign(gameStateVars, newState);
}

function clearTimeoutsAndIntervals() {
     if (enemyInterval) clearInterval(enemyInterval);
    if (gameStateVars.player.fireRateBoostTimeout) clearTimeout(gameStateVars.player.fireRateBoostTimeout); 
    if (gameStateVars.player.speedBoostTimeout) clearTimeout(gameStateVars.player.speedBoostTimeout); 
}

function resetGame(shouldClearInterval = true) {
    if (shouldClearInterval) clearTimeoutsAndIntervals();

    const newState = getInitialState();
    newState.player.x = canvas.width / 2; 
    newState.gameState = 'playing'; 
    newState.gameRunning = true; 
    updateState(newState);
    gunDetails = JSON.parse(JSON.stringify(BASE_GUN_DETAILS)); 
    
    startScreen.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    endScreen.classList.add('hidden');
    creditsScreen.classList.add('hidden');

    enemyInterval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL); 
}

function showStartScreen() {
    clearTimeoutsAndIntervals();
    updateState(getInitialState());
    gameStateVars.gameState = 'startScreen';
    
    startScreen.classList.remove('hidden');
    pauseMenu.classList.add('hidden');
    endScreen.classList.add('hidden');
    creditsScreen.classList.add('hidden');
}

function togglePause() {
    if (gameStateVars.gameState === 'playing') {
        gameStateVars.gameState = 'paused';
        gameStateVars.gameRunning = false;
        pauseMenu.classList.remove('hidden');
        if (enemyInterval) clearInterval(enemyInterval);
    } else if (gameStateVars.gameState === 'paused') {
        gameStateVars.gameState = 'playing';
        gameStateVars.gameRunning = true;
        pauseMenu.classList.add('hidden');
        enemyInterval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);
    }
}

function gameOver(message = "GAME OVER!") {
    clearTimeoutsAndIntervals();
    updateState({ gameRunning: false, gameState: 'gameOver' });
    
    endText.innerText = `${message} Final Score: ${gameStateVars.score}`;
    endScreen.classList.remove('hidden');
    pauseMenu.classList.add('hidden');
    startScreen.classList.add('hidden');
}

function gameWin() {
    gameOver("VICTORY! You defeated the Boss!");
}

function hitPlayer() { 
    if (gameStateVars.player.invulnerable || !gameStateVars.gameRunning) return;

    gameStateVars.player.health--;
    gameStateVars.player.invulnerable = true; 
    
    setTimeout(() => {
        gameStateVars.player.invulnerable = false;
    }, 1500); 

    if (gameStateVars.player.health <= 0) {
        gameOver();
    }
}

function cycleGun(direction) { 
    let p = gameStateVars.player;
    let numGuns = p.collectedGuns.length;
    if (numGuns <= 1 || gameStateVars.gameState !== 'playing') return;

    let currentIndex = p.collectedGuns.indexOf(p.currentGunIndex);
    
    if (direction === 1) { 
        currentIndex = (currentIndex + 1) % numGuns;
    } else if (direction === -1) { 
        currentIndex = (currentIndex - 1 + numGuns) % numGuns;
    }
    p.currentGunIndex = p.collectedGuns[currentIndex];
}

function equipGun(index) { 
    if (gameStateVars.gameState !== 'playing') return;
    if (index >= 0 && index < gunDetails.length && gameStateVars.player.collectedGuns.includes(index)) {
        gameStateVars.player.currentGunIndex = index;
    }
}

function applyPowerupEffect(type) { 
    let p = gameStateVars.player;
    const DURATION = 5000; 

    if (type === 'health') {
        if (p.health < p.maxHealth) { p.health++; }
    } else if (type === 'fireRate') {
        if (p.fireRateBoostTimeout) clearTimeout(p.fireRateBoostTimeout);
        gunDetails.forEach((gun, index) => {
            gun.delay = BASE_GUN_DETAILS[index].delay * 0.5; 
        });
        p.fireRateBoostTimeout = setTimeout(() => {
            gunDetails = JSON.parse(JSON.stringify(BASE_GUN_DETAILS)); 
            p.fireRateBoostTimeout = null;
        }, DURATION); 
    } else if (type === 'speed') {
        if (p.speedBoostTimeout) clearTimeout(p.speedBoostTimeout);
        p.speed = p.baseSpeed * 2; 
        p.speedBoostTimeout = setTimeout(() => {
            p.speed = p.baseSpeed; 
            p.speedBoostTimeout = null;
        }, DURATION);
    }
}

function fireBullet() { 
    let p = gameStateVars.player;
    if (p.canShoot && gameStateVars.gameRunning) {
        const gun = gunDetails[p.currentGunIndex];
        
        for(let i = 0; i < gun.count; i++) {
            let spreadOffset = (i - (gun.count - 1) / 2) * gun.spread;
            
            let bullet = {
                x: p.x + spreadOffset, y: p.y - p.size, radius: gun.size,
                speed: gun.speed, damage: gun.damage, color: gun.color,
                assetKey: gun.assetKey, isRocket: gun.isRocket 
            };
            gameStateVars.bullets.push(bullet); 
        }
        
        p.canShoot = false; 
        setTimeout(() => p.canShoot = true, gun.delay); 
    }
}

function fireEnemyBullet(enemy) { 
    const assetInfo = enemyBulletMapping[enemy.type];
    if (!assetInfo) return; 

    let shotCount = (enemy.type === 'frigate' || enemy.type === 'battlecruiser') ? 3 : 1;
    
    for(let i = 0; i < shotCount; i++) {
        let spreadOffset = shotCount > 1 ? (i - (shotCount - 1) / 2) * 15 : 0;
        let bullet = {
            x: enemy.x + spreadOffset, y: enemy.y + enemy.size / 2,
            speed: assetInfo.speed, radius: assetInfo.size, color: '#fff', 
            assetKey: assetInfo.assetKey 
        };
        gameStateVars.enemyBullets.push(bullet);
    }
}

function spawnEnemy() { 
    if (!gameStateVars.gameRunning || gameStateVars.isBossActive) return;

    let typeKey;
    const rand = Math.random();
    if (rand < 0.35) { typeKey = 'fighter'; } 
    else if (rand < 0.60) { typeKey = 'scout'; } 
    else if (rand < 0.75) { typeKey = 'frigate'; } 
    else if (rand < 0.88) { typeKey = 'torpedo_ship'; } 
    else if (rand < 0.96) { typeKey = 'battlecruiser'; } 
    else { typeKey = 'dreadnought'; }

    let type = enemyTypes[typeKey];

    let enemy = {
        x: Math.random() * (canvas.width - type.size) + type.size / 2,
        y: 0, ...type, health: type.maxHealth, maxHealth: type.maxHealth, type: typeKey
    };
    gameStateVars.enemies.push(enemy);
}

function spawnBoss() { 
    if (gameStateVars.isBossActive) return;
    
    gameStateVars.isBossActive = true;
    if (enemyInterval) clearInterval(enemyInterval);
    gameStateVars.enemies = []; 
    
    gameStateVars.boss = {
        x: canvas.width / 2, y: 100, ...bossDetails,
        health: bossDetails.maxHealth, maxHealth: bossDetails.maxHealth, lastShotTime: Date.now()
    };
}


// --- EXPLOSION SYSTEM ---

function createExplosion(x, y, color = 'orange', size = 50, duration = 300) {
    gameStateVars.explosions.push({
        x: x, y: y, 
        radius: 1, 
        maxRadius: size, 
        color: color,
        startTime: Date.now(),
        duration: duration
    });
}

function updateExplosions() {
    const now = Date.now();
    for (let i = gameStateVars.explosions.length - 1; i >= 0; i--) {
        const exp = gameStateVars.explosions[i];
        const elapsed = now - exp.startTime;
        
        if (elapsed > exp.duration) {
            gameStateVars.explosions.splice(i, 1);
            continue;
        }

        const progress = elapsed / exp.duration;
        // Expand and fade effect
        exp.radius = exp.maxRadius * progress;
        exp.alpha = 1 - progress;
    }
}

function drawExplosions() {
    gameStateVars.explosions.forEach(exp => {
        ctx.save();
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = exp.color;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}


// --- MOVEMENT & GAME LOGIC ---

function update() {
    if (gameStateVars.gameState !== 'playing') return;

    let p = gameStateVars.player;
    
    // 1. CONDITIONAL AUTO-FIRE IMPLEMENTATION: Only fire if touch is active
    if (touchActive) {
        fireBullet(); 
    }
    
    // 2. Player Movement (PC Controls)
    if (keys['ArrowLeft'] || keys['a']) { p.x = Math.max(0 + p.size/2, p.x - p.speed); }
    if (keys['ArrowRight'] || keys['d']) { p.x = Math.min(canvas.width - p.size/2, p.x + p.speed); }
    
    // 3. Player Movement (Touch Controls)
    if (touchActive && touchX !== null) {
        const dx = touchX - p.x;
        const distance = Math.abs(dx);
        
        if (distance > p.speed) {
            p.x += Math.sign(dx) * p.speed;
        } else if (distance > 0) {
            p.x = touchX;
        }
        
        p.x = Math.max(p.size/2, Math.min(canvas.width - p.size/2, p.x));
    }


    // Object movement/cleanup
    for (let i = gameStateVars.bullets.length - 1; i >= 0; i--) {
        gameStateVars.bullets[i].y -= gameStateVars.bullets[i].speed;
        if (gameStateVars.bullets[i].y < 0) { gameStateVars.bullets.splice(i, 1); }
    }
    
    for (let i = gameStateVars.enemies.length - 1; i >= 0; i--) {
        let enemy = gameStateVars.enemies[i];
        enemy.y += enemy.speed;
        if (Math.random() < enemy.shootChance) { fireEnemyBullet(enemy); }
        if (enemy.y > canvas.height) { gameOver(); return; }
    }
    
    for (let i = gameStateVars.pickups.length - 1; i >= 0; i--) {
        gameStateVars.pickups[i].y += 3; 
        if (gameStateVars.pickups[i].y > canvas.height) { gameStateVars.pickups.splice(i, 1); }
    }

    if (gameStateVars.isBossActive && gameStateVars.boss) {
        let boss = gameStateVars.boss;
        boss.x += boss.speed;
        if (boss.x > canvas.width - boss.size / 2 || boss.x < boss.size / 2) { boss.speed *= -1; }
        const now = Date.now();
        if (now - boss.lastShotTime > boss.shootInterval) {
            const bossBullet = { x: boss.x, y: boss.y + boss.size / 2, speed: 2.5, radius: 20, assetKey: 'bullet_rocket' };
            gameStateVars.enemyBullets.push(bossBullet);
            boss.lastShotTime = now;
        }
    }

    for (let i = gameStateVars.enemyBullets.length - 1; i >= 0; i--) {
        gameStateVars.enemyBullets[i].y += gameStateVars.enemyBullets[i].speed;
        if (gameStateVars.enemyBullets[i].y > canvas.height) { gameStateVars.enemyBullets.splice(i, 1); }
    }
    
    updateStars(); 
    updateExplosions(); // NEW: Update explosion state

    if (!gameStateVars.isBossActive && gameStateVars.score >= BOSS_SCORE_THRESHOLD) {
        spawnBoss();
    }
}

// --- COLLISION DETECTION ---
function checkCollisions() {
    if (gameStateVars.gameState !== 'playing') return;
    
    let p = gameStateVars.player;
    const ROCKET_SPLASH_RADIUS = 100;
    const ROCKET_SPLASH_DAMAGE = 1; // Damage applied to nearby enemies

    // 1. Player Bullets vs. Targets (Enemies or Boss)
    for (let i = gameStateVars.bullets.length - 1; i >= 0; i--) {
        let bullet = gameStateVars.bullets[i];
        let bulletHit = false; 
        let targetX = null;
        let targetY = null;
        
        // Check collision with Boss
        if (gameStateVars.isBossActive && gameStateVars.boss) {
            let boss = gameStateVars.boss;
            const distance = Math.sqrt(Math.pow(bullet.x - boss.x, 2) + Math.pow(bullet.y - boss.y, 2));

            if (distance < bullet.radius + boss.size / 2) {
                gameStateVars.bullets.splice(i, 1);
                boss.health -= bullet.damage; 
                bulletHit = true;
                targetX = boss.x;
                targetY = boss.y;
                
                if (boss.health <= 0) {
                    gameStateVars.score += boss.score;
                    createExplosion(boss.x, boss.y, 'red', 150, 1000); // Big Boss Explosion
                    gameStateVars.boss = null;
                    gameStateVars.isBossActive = false;
                    gameWin();
                }
            }
        }
        
        // Check collision with Regular Enemies
        if (!bulletHit) {
            for (let j = gameStateVars.enemies.length - 1; j >= 0; j--) {
                let enemy = gameStateVars.enemies[j];
                const distance = Math.sqrt(Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2));

                if (distance < bullet.radius + enemy.size / 2) {
                    gameStateVars.bullets.splice(i, 1); 
                    enemy.health -= bullet.damage; 
                    bulletHit = true; 
                    targetX = enemy.x;
                    targetY = enemy.y;

                    if (enemy.health <= 0) {
                        gameStateVars.score += enemy.score;
                        createExplosion(enemy.x, enemy.y, 'yellow', enemy.size, 500); // Enemy Explosion
                        gameStateVars.enemies.splice(j, 1); 
                        
                        if (Math.random() < 0.15) { 
                            const pickupTypes = ['health', 'fireRate', 'speed'];
                            const randomType = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
                            const details = pickupDetails[randomType];
                            gameStateVars.pickups.push({
                                x: targetX, y: targetY, radius: details.size / 2, type: details.type, assetKey: details.assetKey
                            });
                        }
                    }
                    break; 
                }
            }
        }

        // NEW: Rocket Splash Damage Logic
        if (bulletHit && bullet.isRocket) {
            createExplosion(targetX, targetY, 'orange', ROCKET_SPLASH_RADIUS, 500); // Rocket Impact Explosion
            
            // Check all other enemies for splash damage
            for (let k = gameStateVars.enemies.length - 1; k >= 0; k--) {
                let otherEnemy = gameStateVars.enemies[k];
                if (otherEnemy.x === targetX && otherEnemy.y === targetY) continue; // Skip the enemy that was directly hit

                const splashDistance = Math.sqrt(Math.pow(targetX - otherEnemy.x, 2) + Math.pow(targetY - otherEnemy.y, 2));
                
                if (splashDistance < ROCKET_SPLASH_RADIUS) {
                    otherEnemy.health -= ROCKET_SPLASH_DAMAGE;
                    if (otherEnemy.health <= 0) {
                        gameStateVars.score += otherEnemy.score;
                        createExplosion(otherEnemy.x, otherEnemy.y, 'yellow', otherEnemy.size, 500); // Secondary Explosion
                        gameStateVars.enemies.splice(k, 1);
                    }
                }
            }
        }
    }
    
    // 2. Enemy Bullets vs. Player
    for (let i = gameStateVars.enemyBullets.length - 1; i >= 0; i--) {
        let eb = gameStateVars.enemyBullets[i];
        const distance = Math.sqrt(Math.pow(eb.x - p.x, 2) + Math.pow(eb.y - p.y, 2));
        
        if (distance < eb.radius + p.size / 2) {
            gameStateVars.enemyBullets.splice(i, 1); 
            hitPlayer(); 
            createExplosion(eb.x, eb.y, 'red', 20, 200); // Small impact explosion
            break;
        }
    }
    
    // 3. Pickups vs. Player
    for (let i = gameStateVars.pickups.length - 1; i >= 0; i--) {
        let pickup = gameStateVars.pickups[i];
        const distance = Math.sqrt(Math.pow(pickup.x - p.x, 2) + Math.pow(pickup.y - p.y, 2));

        if (distance < pickup.radius + p.size / 2) {
            applyPowerupEffect(pickup.type);
            gameStateVars.pickups.splice(i, 1); 
            break;
        }
    }
}

// --- DRAWING / RENDERING ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(); 

    if (gameStateVars.gameState === 'startScreen' || gameStateVars.gameState === 'credits') {
        ctx.fillStyle = '#0f0';
        ctx.font = '30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("ULTIMATE SPACE SHOOTER", canvas.width / 2, canvas.height / 2 - 150);
        requestAnimationFrame(draw);
        return;
    }

    let p = gameStateVars.player;
    
    // Draw Score and HUD
    ctx.fillStyle = '#0f0';
    ctx.font = '20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameStateVars.score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Health: ${'♥'.repeat(p.health)}`, canvas.width - 150, 30); 
    const currentGun = gunDetails[p.currentGunIndex];
    ctx.fillText(`Gun: ${currentGun.name}`, canvas.width - 250, 60);

    // Draw Powerup Status
    let statusText = "";
    if (p.fireRateBoostTimeout) { statusText += " [FAST SHOOT] "; }
    if (p.speedBoostTimeout) { statusText += " [HIGH SPEED] "; }
    if (statusText) {
        ctx.fillStyle = '#ff4500';
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(statusText, canvas.width / 2, 60);
    }

    ctx.textAlign = 'start'; // Reset alignment for drawing objects
    
    // 2. Draw Player Ship
    if (!p.invulnerable || (Math.floor(Date.now() / 100) % 2 == 0)) {
        const img = assets['player'];
        if (img && img.complete) {
            ctx.drawImage(img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
    }

    // 3. Draw Player Bullets
    gameStateVars.bullets.forEach(bullet => {
        const img = assets[bullet.assetKey];
        if (img && img.complete) {
            ctx.drawImage(img, bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2);
        }
    });

    // 4. Draw Enemy Bullets 
    gameStateVars.enemyBullets.forEach(eb => {
        const img = assets[eb.assetKey]; 
        if (img && img.complete) {
            ctx.drawImage(img, eb.x - eb.radius, eb.y - eb.radius, eb.radius * 2, eb.radius * 2);
        } else {
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(eb.x - 2, eb.y - 2, 4, 4);
        }
    });

    // 5. Draw Pickups 
    gameStateVars.pickups.forEach(pickup => {
        const img = assets[pickup.assetKey];
        if (img && img.complete) {
            const size = pickup.radius * 2;
            ctx.drawImage(img, pickup.x - pickup.radius, pickup.y - pickup.radius, size, size);
        }
    });

    // 6. Draw Enemies
    gameStateVars.enemies.forEach(enemy => {
        const img = assets[enemy.image]; 
        if (img && img.complete) { 
            ctx.drawImage(img, enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
        }
        
        // Draw Health Bar
        if (enemy.maxHealth > 1) {
            ctx.fillStyle = 'yellow';
            const barWidth = enemy.size * (enemy.health / enemy.maxHealth);
            ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size * 0.7, barWidth, 3);
        }
    });
    
    // 7. Draw BOSS
    if (gameStateVars.isBossActive && gameStateVars.boss) {
        let boss = gameStateVars.boss;
        const img = assets['boss'];
        if (img && img.complete) {
            ctx.drawImage(img, boss.x - boss.size / 2, boss.y - boss.size / 2, boss.size, boss.size);
        }
        
        // Boss Health Bar (Large)
        ctx.fillStyle = 'red';
        const totalBarWidth = canvas.width - 20;
        const currentBossHealthBar = totalBarWidth * (boss.health / boss.maxHealth);
        ctx.fillRect(10, 80, currentBossHealthBar, 10);
        ctx.strokeStyle = '#0f0';
        ctx.strokeRect(10, 80, totalBarWidth, 10);
    }
    
    drawExplosions(); // NEW: Draw explosions on top

}

// --- GAME LOOP ---
function gameLoop() {
    update(); 
    checkCollisions(); 
    draw();   
    
    requestAnimationFrame(gameLoop); 
}

// --- INPUT HANDLERS (PC) ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameStateVars.gameState === 'playing' || gameStateVars.gameState === 'paused') {
            togglePause();
        }
        return;
    }

    keys[e.key] = true;

    if (gameStateVars.gameState === 'playing') {
        
        // PC Shooting
        if (e.key === ' ') {
            fireBullet();
        }
        
        if (e.key === 'e') { cycleGun(1); keys['e'] = false; } 
        if (e.key === 'q') { cycleGun(-1); keys['q'] = false; } 

        if (e.key >= '1' && e.key <= '4') { 
            equipGun(parseInt(e.key) - 1);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key !== 'e' && e.key !== 'q' && !(e.key >= '1' && e.key <= '4')) {
        keys[e.key] = false;
    }
});

// --- INPUT HANDLERS (TOUCH/MOBILE) ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    if (e.touches.length > 0) {
        touchActive = true;
        // Check if the touch is within the canvas bounds (client X might be larger than canvas width on desktop)
        touchX = Math.min(e.touches[0].clientX, canvas.width); 
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    if (e.touches.length > 0 && touchActive) {
        // Constrain touchX to the canvas width
        touchX = Math.min(e.touches[0].clientX, canvas.width); 
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault(); 
    if (e.touches.length === 0) {
        touchActive = false;
        touchX = null;
    }
}, { passive: false });


// --- GUI BUTTON HANDLERS ---
document.getElementById('playButton').addEventListener('click', () => resetGame(true));
document.getElementById('creditsButton').addEventListener('click', () => {
     gameStateVars.gameState = 'credits';
     startScreen.classList.add('hidden');
     creditsScreen.classList.remove('hidden');
});
document.getElementById('backToStartButton').addEventListener('click', showStartScreen);


document.getElementById('resumeButton').addEventListener('click', togglePause);
document.getElementById('pauseRestartButton').addEventListener('click', () => resetGame(true));
document.getElementById('pauseQuitButton').addEventListener('click', showStartScreen);

document.getElementById('restartButton').addEventListener('click', () => resetGame(true));
document.getElementById('endQuitButton').addEventListener('click', showStartScreen);

// --- STARTUP ---
loadImages(() => {
    resizeCanvas(); 
    initializeStars(); 
    showStartScreen(); 
    gameLoop();
});
