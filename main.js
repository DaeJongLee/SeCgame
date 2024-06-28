const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game;
let player;
let cursors;
let npcs;
let secCells;
let score = 0;
let scoreText;
let timer;
let userType;
let speed = 200;
let gameStage = 1;
let totalUsers = 1;
let resourceConsumptionRate = 10000; // 10 seconds
let evolutionThreshold = [30, 50, 100];
let secCellCount = 0;
let multiCellCount = 0;
let upgradeIndicator;
let stageText;

function start(type) {
    userType = type;
    game = new Phaser.Game(config);
}

function preload() {
    this.load.image('cell', 'assets/images/cell.png');
    this.load.image('npc', 'assets/images/npc.png');
    this.load.image('sec', 'assets/images/sec.png');
}

function create() {
    player = this.physics.add.sprite(400, 300, 'cell').setScale(0.5);
    player.setCollideWorldBounds(true);

    npcs = this.physics.add.group();
    secCells = this.physics.add.group();

    for (let i = 0; i < 10; i++) {
        createNpc(this);
    }

    this.physics.add.collider(player, npcs, collectNpc, null, this);
    this.physics.add.collider(player, secCells, collectSec, null, this);

    cursors = this.input.keyboard.createCursorKeys();

    scoreText = this.add.text(16, 16, 'Score: ' + score, { fontSize: '32px', fill: '#fff' });
    stageText = this.add.text(16, 50, 'Stage: ' + gameStage, { fontSize: '32px', fill: '#fff' });

    if (userType !== 'dev') {
        timer = this.time.addEvent({
            delay: resourceConsumptionRate,
            callback: decreaseResource,
            callbackScope: this,
            loop: true
        });
    }

    this.time.addEvent({
        delay: Phaser.Math.Between(5000, 15000),
        callback: () => createNpc(this),
        callbackScope: this,
        loop: true
    });

    if (userType === 'dev') {
        this.input.keyboard.on('keydown-SPACE', nextStage, this);
    }

    this.time.addEvent({
        delay: 5000,
        callback: generateSeC,
        callbackScope: this,
        loop: true
    });

    npcMovementTimer = this.time.addEvent({
        delay: 1000,
        callback: updateNpcMovement,
        callbackScope: this,
        loop: true
    });

    upgradeIndicator = this.add.rectangle(0, 0, config.width, config.height, 0xffff00, 0);
    upgradeIndicator.setStrokeStyle(4, 0xffff00);
    upgradeIndicator.setOrigin(0);
    upgradeIndicator.setVisible(false);

    this.input.keyboard.on('keydown-SPACE', attemptUpgrade, this);
}

function update() {
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
    }
    if (cursors.right.isDown) {
        player.setVelocityX(speed);
    }
    if (cursors.up.isDown) {
        player.setVelocityY(-speed);
    }
    if (cursors.down.isDown) {
        player.setVelocityY(speed);
    }

    checkUpgradeCondition();
    checkEvolution();
    secResourceGain();
}

function createNpc(scene) {
    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);
    const npc = scene.physics.add.sprite(x, y, 'npc').setScale(0.5);
    npc.setCollideWorldBounds(true);
    npc.setBounce(1);
    npc.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    npcs.add(npc);
}

function collectNpc(player, npc) {
    npc.disableBody(true, true);
    increaseScore(1);
}

function collectSec(player, sec) {
    sec.disableBody(true, true);
    increaseScore(10);
}

function increaseScore(points) {
    score += points;
    scoreText.setText('Score: ' + score);
}

function decreaseResource() {
    score -= 1;
    scoreText.setText('Score: ' + score);
    if (score < 0) {
        // Game over logic
    }
}

function nextStage() {
    gameStage++;
    updateGameStage();
}

function checkEvolution() {
    if (score >= evolutionThreshold[gameStage - 1] && (totalUsers >= gameStage + 1 || userType === 'dev')) {
        nextStage();
    }
}

function updateGameStage() {
    switch(gameStage) {
        case 2:
            resourceConsumptionRate = 20000; // 20 seconds
            break;
        case 3:
            resourceConsumptionRate = Infinity; // Stop resource consumption
            break;
    }
    updateTimers();
    if (gameStage >= 2) {
        createMultiCells();
    }
    stageText.setText('Stage: ' + gameStage);
}

function updateTimers() {
    if (timer) timer.remove();
    if (gameStage < 3 && userType !== 'dev') {
        timer = this.time.addEvent({
            delay: resourceConsumptionRate,
            callback: decreaseResource,
            callbackScope: this,
            loop: true
        });
    }
}

function createMultiCells() {
    const multiCell = this.physics.add.sprite(player.x, player.y, 'cell').setScale(0.4);
    multiCell.setCollideWorldBounds(true);
    multiCell.setBounce(1);
    multiCell.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    npcs.add(multiCell);
}

function generateSeC() {
    if (gameStage >= 2) {
        const secCount = gameStage === 2 ? 1 : 2;
        for (let i = 0; i < secCount; i++) {
            const sec = this.physics.add.sprite(player.x, player.y, 'sec').setScale(0.3);
            secCells.add(sec);
            sec.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        }
    }
}

function secResourceGain() {
    if (gameStage === 3) {
        secCells.getChildren().forEach((sec) => {
            if (Math.random() < 0.5) {
                score += Phaser.Math.Between(5, 10);
                scoreText.setText('Score: ' + score);
            }
        });
    }
}

function checkUpgradeCondition() {
    let canUpgrade = false;
    if (gameStage === 1 && score >= 30 && totalUsers >= 2) canUpgrade = true;
    if (gameStage === 2 && score >= 50 && totalUsers >= 3) canUpgrade = true;
    if (gameStage === 3 && score >= 100 && totalUsers >= 5) canUpgrade = true;

    upgradeIndicator.setVisible(canUpgrade);
}

function attemptUpgrade() {
    if (upgradeIndicator.visible) {
        gameStage++;
        updateGameStage();
        upgradeIndicator.setVisible(false);
    }
}

function updateNpcMovement() {
    npcs.getChildren().forEach((npc) => {
        npc.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    });
}
