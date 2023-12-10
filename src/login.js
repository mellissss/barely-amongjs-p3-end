document.addEventListener("DOMContentLoaded", function () {
	document
		.getElementById("loginButton")
		.addEventListener("click", function () {
			axios
				.post("https://localhost:7278/Account/Login", {
					username: document.getElementById("username").value,
					password: document.getElementById("password").value,
				})
				.then(function (response) {
					Cookies.remove("token");
					Cookies.remove("username");
					Cookies.set("token", response.data.access_token);
					Cookies.set("username", response.data.username);
					location.href = "./main.html";
				})
				.catch(function (error) {
					console.log(error);
				});
		});
});
