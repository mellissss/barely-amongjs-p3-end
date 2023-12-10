//import Phaser from "phaser";
//import { io } from "socket.io-client";

//import shipImg from "./assets/ship.png";
//import playerSprite from "./assets/player.png";
import {
	PLAYER_SPRITE_HEIGHT,
	PLAYER_SPRITE_WIDTH,
	PLAYER_HEIGHT,
	PLAYER_WIDTH,
	PLAYER_START_X,
	PLAYER_START_Y,
} from "./constants.js";
import { movePlayer } from "./movement.js";
import { animateMovement } from "./animation.js";
import {
	getQueryParameter,
	getRandomString,
	updateQueryParameter,
} from "./utils.js";
let shipImg = "/src/assets/ship.png";
let playerSprite = "/src/assets/player.png";
//const player = {};
//const otherPlayer = {};
let socket;
let pressedKeys = [];

var players = [];

const room = getQueryParameter("room") || getRandomString(5);
window.history.replaceState(
	{},
	document.title,
	updateQueryParameter("room", room)
);
var roomId = undefined;
var userIds = undefined;
class MyGame extends Phaser.Scene {
	constructor() {
		super();
	}

	preload() {
		userIds.forEach((id) => {
			players.push({
				id: id,
				name: "player" + id,
			});
			this.load.spritesheet("player" + id, playerSprite, {
				frameWidth: PLAYER_SPRITE_WIDTH,
				frameHeight: PLAYER_SPRITE_HEIGHT,
			});
		});
		this.load.image("ship", shipImg);
	}

	create() {
		const ship = this.add.image(0, 0, "ship");
		players.forEach((player) => {
			player.sprite = this.add.sprite(
				PLAYER_START_X,
				PLAYER_START_Y,
				player.name
			);
			player.sprite.displayHeight = PLAYER_HEIGHT;
			player.sprite.displayWidth = PLAYER_WIDTH;
			player.sprite.anims.create({
				key: "running",
				frames: player.sprite.anims.generateFrameNumbers(player.name),
				frameRate: 24,
				reapeat: -1,
			});
		});
		let player = players.filter((x) => x.id == Cookies.get("username"))[0];
		// Включаем физику для игрока
		//this.physics.world.setBounds(0, 0, 800, 600); // Устанавливаем границы мира
		//this.physics.add.existing(player.sprite); // Добавляем существующий объект в физический мир

		//this.cameras.main.setBounds(0, 0, 800, 600); // Устанавливаем границы камеры
		this.cameras.main.startFollow(player.sprite); // Начинаем следить за игроком
		this.cameras.main.setZoom(3); // Устанавливаем уровень масштабирования (приближение)

		console.log(players);

		this.input.keyboard.on("keydown", (e) => {
			if (!pressedKeys.includes(e.code)) {
				pressedKeys.push(e.code);
			}
		});
		this.input.keyboard.on("keyup", (e) => {
			pressedKeys = pressedKeys.filter((key) => key !== e.code);
		});

		connection.on("move", ({ x, y, login }) => {
			let otherPlayer = players.filter((x) => x.id == login)[0];
			if (otherPlayer.sprite.x > x) {
				otherPlayer.sprite.flipX = true;
			} else if (otherPlayer.sprite.x < x) {
				otherPlayer.sprite.flipX = false;
			}
			otherPlayer.sprite.x = x;
			otherPlayer.sprite.y = y;
			otherPlayer.moving = true;
		});
		connection.on("moveEnd", (login) => {
			let otherPlayer = players.filter((x) => x.id == login)[0];
			otherPlayer.moving = false;
		});

		connection.on("Disconnect", (login) => {
			console.log(login);
		});
	}

	update() {
		let player = players.filter((x) => x.id == Cookies.get("username"))[0];
		/*this.scene.scene.cameras.main.centerOn(
			player.sprite.x,
			player.sprite.y
		);*/
		//console.log(this.scene.scene.cameras.main);
		const playerMoved = movePlayer(pressedKeys, player.sprite);
		if (playerMoved) {
			connection.invoke("move", {
				x: player.sprite.x,
				y: player.sprite.y,
				login: player.id,
			});
			player.movedLastFrame = true;
		} else {
			if (player.movedLastFrame) {
				connection.invoke("moveEnd", player.id);
			}
			player.movedLastFrame = false;
		}
		animateMovement(pressedKeys, player.sprite);
		// Aninamte other player
		let otherPlayers = players.filter((x) => x.id != player.id);
		otherPlayers.forEach((otherPlayer) => {
			if (otherPlayer.moving && !otherPlayer.sprite.anims.isPlaying) {
				otherPlayer.sprite.play("running");
			} else if (
				!otherPlayer.moving &&
				otherPlayer.sprite.anims.isPlaying
			) {
				otherPlayer.sprite.stop("running");
			}
		});
	}
}
var game;
export function startGame(Id) {
	const config = {
		type: Phaser.AUTO,
		parent: "game",
		width: "100%",
		height: "100%",
		scene: MyGame,
		//zoom: 1.75,
	};
	roomId = Id;
	axios
		.get("https://localhost:7278/Rooms/GetUserIds", {
			params: { roomId: roomId },
		})
		.then(function (response) {
			userIds = response.data;
			game = new Phaser.Game(config);
			console.log(userIds);

			console.log(game);
		})
		.catch(function (error) {
			console.log(error);
		});
}
