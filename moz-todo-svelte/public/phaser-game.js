var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 500 },
        debug: false
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };


var player;
var platforms;
var cursors;

var enemy;
var enemySpeed = 60;
var enemyhealth = 1000;
var playerhealth = 1000;
var enemyDamage = 2;
var playerDamage = 10;
var score = 0;
var scoreAcum = 0;
var scoreText;
var tolerance = 3;
var abso;
var gameOver = false;

// Actualizar tamaño de las barras de vida
var playerHealthRatio = playerhealth / 1000;
var enemyHealthRatio = enemyhealth / 1000;

var playerBarWidth = 100;
var enemyBarWidth = 100;

var playerHealthBar;
var enemyHealthBar;

var enemyX;
var enemyY;

var game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('ground2', 'assets/platform2.jpg');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet('player', 'assets/player.png', { frameWidth: 66, frameHeight: 48 });
  this.load.spritesheet('enemy', 'assets/enemy.png', { frameWidth: 160, frameHeight: 144 });
  this.load.spritesheet('attack', 'assets/attack.png', { frameWidth: 96, frameHeight: 48 });
  this.load.spritesheet('enemyattack', 'assets/enemyattack.png', { frameWidth: 240, frameHeight: 192 });
  this.load.spritesheet('idle', 'assets/idle.png', { frameWidth: 38, frameHeight: 48 });
  this.load.spritesheet('heart', 'assets/heart.png', { frameWidth: 25, frameHeight: 25 });
}

function create() {
  this.add.image(400, 300, 'sky');

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 550, 'ground').setScale(1).refreshBody();

  platforms.create(50, 170, 'ground2');
  platforms.create(750, 150, 'ground2');
  platforms.create(350, 310, 'ground2');
  platforms.create(600, 220, 'ground2');

  player = this.physics.add.sprite(100, 450, 'player');
  enemy = this.physics.add.sprite(700, 350, 'enemy');

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  enemy.setCollideWorldBounds(true);
  player.body.setSize(20, 40);
  enemy.body.setSize(50, 150);

  playerHealthBar = this.add.graphics();
  enemyHealthBar = this.add.graphics();

  playerHealthBar.fillStyle(0x00FF00);
  playerHealthBar.fillRect(player.x - playerBarWidth / 2, player.y - 50, playerBarWidth * playerHealthRatio, 10);

  enemyHealthBar.fillStyle(0xFF0000);
  enemyHealthBar.fillRect(enemy.x - enemyBarWidth / 2, enemy.y - 50, enemyBarWidth * enemyHealthRatio, 10);

  this.anims.create({
    key: 'attack',
    frames: this.anims.generateFrameNumbers('attack', { start: 0, end: 5 }),
    frameRate: 20,
  });
  this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
  });
  this.anims.create({
      key: 'turn',
      frames: [ { key: 'player', frame: 2 } ],
      frameRate: 20
  });
  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
  });
  this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
      frameRate: 10,
  });

  //Enemigo
  this.anims.create({
      key: 'enemydamage',
      frames: this.anims.generateFrameNumbers('enemydamage', { start: 0, end: 5 }),
      frameRate: 10,
  });
  this.anims.create({
      key: 'attackE',
      frames: this.anims.generateFrameNumbers('enemyattack', { start: 0, end: 10 }),
      frameRate: 10,
      repeat: 0
  });
  this.anims.create({
      key: 'leftE',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 5 }),
      frameRate: 5,
      repeat: -1
  });
  this.anims.create({
      key: 'rightE',
      frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 5 }),
      frameRate: 5,
      repeat: -1
  });


  hearts = this.physics.add.group({
      key: 'heart',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
  });
  hearts.children.iterate(function (child) {

      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

  });

  scoreText = this.add.text(16, 16, 'Puntuación: 0', { fontSize: '32px', fill: '#FFFFFF' });

  cursors = this.input.keyboard.createCursorKeys();
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(enemy, platforms);
  this.physics.add.collider(player, enemy);
  this.physics.add.collider(hearts, platforms);
  this.physics.add.overlap(player, hearts, collectHeart, null, this);
  
}

function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown)
  {
      player.setVelocityX(-160);
      player.setFlipX(true); // Voltear el sprite hacia la izquierda

      player.anims.play('left', true);
  }
  else if (cursors.right.isDown)
  {
      player.setVelocityX(160);
      player.setFlipX(false); // Voltear el sprite hacia la izquierda

      player.anims.play('right', true);
  }
  else if (cursors.space.isDown) {
      player.anims.play('attack', true); // Reproducir la animación de ataque
      if (Phaser.Geom.Intersects.RectangleToRectangle(enemy.getBounds(), player.getBounds())) {
          enemyhealth -= playerDamage;
          //console.log('enemy health: ' + enemyhealth);
      }
  }
  else
  {
      player.setVelocityX(0);
      player.anims.play('idle', true);
  }

  if (cursors.up.isDown && player.body.touching.down)
  {
      player.setVelocityY(-500);
  }

  abso = Math.abs(enemy.x - player.x);


  if (Phaser.Geom.Intersects.RectangleToRectangle(enemy.getBounds(), player.getBounds())) {
      // Aquí puedes agregar la lógica que desees cuando haya una colisión
      enemy.setVelocityX(0);
      enemy.anims.play('attackE', true);

      enemy.once('animationcomplete', function(animation) {
          if (animation.key === 'attackE') {
              // Aquí puedes agregar la lógica para causar daño al jugador
              playerhealth -= enemyDamage;
              //console.log('player health: ' + playerhealth);
          }
      });
  }else if(Math.abs(enemy.x - player.x) < tolerance) {
      enemy.setFlipX(false);
      //console.log('quieto');
  }
  else if (enemy.x < player.x && abso > tolerance) {
      enemy.setVelocityX(enemySpeed);
      enemy.anims.play('leftE', true);
      enemy.setFlipX(true);
  } else if (enemy.x > player.x && abso > tolerance) {
      enemy.setVelocityX(-enemySpeed);
      enemy.anims.play('rightE', true);
      enemy.setFlipX(false);
  } 
  //console.log('abs: ' + abso);

  //Barras de vida
  playerHealthRatio = playerhealth / 1000
  enemyHealthRatio = enemyhealth / 1000;

  playerHealthBar.clear();
  playerHealthBar.fillStyle(0x00FF00); // Color verde
  playerHealthBar.fillRect(player.x - playerBarWidth / 2, player.y - 50, playerBarWidth * playerHealthRatio, 10);

  enemyHealthBar.clear();
  enemyHealthBar.fillStyle(0xFF0000); // Color rojo
  enemyHealthBar.fillRect(enemy.x - enemyBarWidth / 2, enemy.y - 50, enemyBarWidth * enemyHealthRatio, 10);


  if (playerhealth <= 0) {
    playerhealth = 0;
    scoreText.setText('Has Muerto!!!');
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
  } else if (playerhealth > 1000) {
    playerhealth = 1000;
  }

  if (enemyhealth <= 0) {
    enemyhealth = 1000;
    score += 10;
    scoreAcum += 10;
    scoreText.setText('Score: ' + score);
    enemy.disableBody(true, true);

    enemyX = Phaser.Math.Between(0, config.width);
    enemyY = Phaser.Math.Between(0, config.height);

    enemy = this.physics.add.sprite(enemyX, 50, 'enemy');
    enemy.setCollideWorldBounds(true);
    enemy.setCollideWorldBounds(true);
    this.physics.add.collider(enemy, platforms);
    this.physics.add.collider(player, enemy);
  }

  if (scoreAcum == 100) {
    scoreAcum = 0;

    hearts.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
  }
}

function collectHeart(player, heart) {
  heart.disableBody(true, true);
  playerhealth += 200;
}