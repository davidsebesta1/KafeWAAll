$(document).ready(function () {
    $('#form').on('submit', function (event) {
        event.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const guid = location.href.split('?')[1].split('=')[1];
        console.log(guid);


        $.ajax({
            url: 'http://localhost:8082/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ guid: guid, username: username, password: password, firstName: firstName, lastName: lastName }),
            success: function (data) {
                if (data.msg === "Invalid credentials") {
                    alert("Register failed: " + data.msg);
                } else {
                    alert("Register successful!");
                    location.href = 'index.html';
                }
            },
            error: function (xhr, status, error) {
                alert("An error occurred during login: " + xhr);
            }
        });

    });
});