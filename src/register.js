document.addEventListener("DOMContentLoaded", function () {
	document
		.getElementById("registerButton")
		.addEventListener("click", function () {
			axios
				.post("https://localhost:7278/Account/Register", {
					login: document.getElementById("username").value,
					password: document.getElementById("password").value,
				})
				.then(function (response) {
					location.href = "login.html";
				})
				.catch(function (error) {
					console.log(error);
				});
		});
});
