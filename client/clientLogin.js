$(document).ready(function () {
    $('#form').on('submit', function (event) {
        event.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: 'http://localhost:8082/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username: username, password: password }),
            success: function (data) {
                if (data.msg === "Invalid credentials") {
                    alert("Login failed: " + data.msg);
                } else {
                    alert("Login successful!");
                    location.href = 'index.html';
                }
            },
            error: function (xhr, status, error) {
                alert("An error occurred during login: " + xhr);
            }
        });
    });
});