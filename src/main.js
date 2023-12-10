import { startGame } from "./index.js";

var connection = undefined;
var roomId = undefined;
document.addEventListener("DOMContentLoaded", function () {
	let token = Cookies.get("token");
	axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	///отрисовка комнат(карточек)
	axios.get("https://localhost:7278/Rooms/GetAll").then(function (response) {
		for (let room of response.data) {
			document.getElementById("roomList").insertAdjacentHTML(
				"beforeend",
				`<div class="col-md-4 mb-4">
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">${room.name}</h5>
            <p class="card-text">Участники: ${room.playersCount} / 10</p>
            ${room.isPassword ? '<i class="fas fa-lock"></i>' : " "}
        </div>
        <div class="card-footer text-center">
            <button class="btn btn-primary enterRoom" data-id="${
				room.id
			}">Войти</button>
        </div>
    </div>
</div>`
			);
		}
		///клик по комнате войти в комнату
		document.querySelectorAll(".enterRoom").forEach((x) => {
			x.addEventListener("click", function () {
				let roomId = this.dataset.id;
				axios
					.post("https://localhost:7278/Rooms/Enter", {
						roomId: roomId,
					})
					.then(function (response) {
						location.reload();
					})
					.catch(function (error) {
						console.log(error);
					});
			});
		});
	});
	///клик по комнате создать комнату
	document
		.getElementById("createRoomButton")
		.addEventListener("click", function () {
			axios
				.post("https://localhost:7278/Rooms/Create", {
					name: document.getElementById("roomName").value,
					password: document.getElementById("roomPassword").value,
					creatorId: 1,
				})
				.then(function (response) {
					location.reload();
				})
				.catch(function (error) {
					console.log(error);
				});
		});

	let username = Cookies.get("username");
	document.getElementById("nickname").textContent = username;

	function conncectToRoom() {
		connection = new signalR.HubConnectionBuilder()
			.withUrl("https://localhost:7278/gameHub", {
				withCredentials: false,
				accessTokenFactory: () => {
					return Cookies.get("token");
				},
			})
			.configureLogging(signalR.LogLevel.Information)
			.build();
		window.connection = connection;

		connection
			.start()
			.then(function () {
				console.log("connection Started...");
				connection.invoke("Connect", roomId);
				connection.invoke("RefreshRoom", roomId);
			})
			.catch(function (err) {
				return console.error(err);
			});
	}
	function refreshRoom() {
		axios
			.get("https://localhost:7278/Rooms/GetInfo")
			.then(function (response) {
				let users = response.data.users;
				document.getElementById("roomReadyCount").textContent =
					users.filter((x) => x.isReady).length;
				document.getElementById("roomUsersCount").textContent =
					users.length;
				document.getElementById("roomUsers").textContent = "";
				users.forEach((x) => {
					document.getElementById("roomUsers").insertAdjacentHTML(
						"beforeend",
						`
					<li class="list-group-item ${x.isReady ? "active" : " "}">${x.name}</li>`
					);
				});
			});
	}

	///проверка на то находится ли пользователь в комнате
	axios.get("https://localhost:7278/Users/GetInfo").then(function (response) {
		if (response.data.currentRoomId) {
			const roomModal = new bootstrap.Modal(
				document.getElementById("roomModal")
			);
			roomId = response.data.currentRoomId;
			roomModal.show();
			document.getElementById("roomNameModal").textContent =
				response.data.name;
			refreshRoom();
			if (!connection) {
				conncectToRoom();
			}
			connection.on("RefreshRoom", function () {
				refreshRoom();
			});
			connection.on("StartGame", function () {
				startGame(roomId);
				document.getElementById("game").style.display = "block";
			});
		}
	});
	///кнопка выхода
	document.getElementById("exitRoom").addEventListener("click", function () {
		axios
			.post("https://localhost:7278/Rooms/Exit")
			.then(function (response) {
				connection.invoke("RefreshRoom", roomId);
				location.reload();
			})
			.catch(function (error) {
				console.log(error);
			});
	});

	document.getElementById("Play").addEventListener("click", function () {
		connection.invoke("StartGame", roomId);
		startGame(roomId);
		document.getElementById("game").style.display = "block";
	});
});
