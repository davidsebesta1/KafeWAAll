$(document).ready(function () {
    $.ajax({
        url: 'http://localhost:8082/api?cmd=getUsers',
        type: 'POST',
        contentType: 'application/json',
        success: function (data) {
            data.forEach(user => {
                const userId = `user-${user.ID}`;
                const userName = `${user.LastName} ${user.FirstName}`;

                const radioInput = `<input type="radio" name="user" id="${userId}" value="${userName}">
                                    <label for="${userId}">${userName}</label><br>`;

                $('#form').append(radioInput);
            });
        },
        error: function (xhr, status, error) {
            alert("An error occurred during login: " + error);
        }
    });

    $.ajax({
        url: 'http://localhost:8082/api?cmd=getItemTypeList',
        type: 'POST',
        contentType: 'application/json',
        success: function (data) {
            data.forEach(item => {
                const itemId = `item-${item.ID}`;
                const itemName = item.ItemName;

                const rangeInputHTML = `
                        <label for="${itemId}" class="type-of-drink">${itemName}:</label>
                        <input type="range" id="${itemId}" name="${itemName}" min="0" max="${item.StoredAmount}" value="0"> 
                        <span id="${itemId}-value">0</span><br>
                    `;

                $('#form').append(rangeInputHTML);

                $(`#${itemId}`).on('input', function () {
                    $(`#${itemId}-value`).text(this.value);
                });
            });
        },
        error: function (xhr, status, error) {
            alert("An error occurred while fetching items: " + error);
        }
    });

    $.ajax({
        url: 'http://localhost:8082/api?cmd=getCoffeeStored',
        type: 'POST',
        contentType: 'application/json',
        success: function (data) {
            data.forEach(item => {
                const itemNameId = item.ItemName.toLowerCase().replace(/\W+/g, "");

                let itemParagraph = $(`#${itemNameId}`);

                if (itemParagraph.length === 0) {
                    $('#storage').append(`<p id="${itemNameId}">Zásoba ${item.ItemName.toLowerCase()}: ${item.StoredAmount}</p>`);
                } else {
                    itemParagraph.text(`Zásoba ${item.ItemName.toLowerCase()}: ${item.StoredAmount}`);
                }
            });
        },
        error: function (xhr, status, error) {
            alert("An error occurred while fetching items: " + error);
        }
    });

    $('#form').on('submit', function (event) {
        event.preventDefault();

        $('#form input[type="range"]').each(function () {
            const amt = parseInt($(this).val(), 10);
            const drinkName = $(this).attr("name");
            const drinkId = $(this).attr("id").split("-")[1];

            if (amt > 0) {
                console.log(`Drink ID: ${drinkId}, Name: ${drinkName}, Amount: ${amt}`);

                $.ajax({
                    url: 'http://localhost:8082/api?cmd=addEntry',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ itemId: drinkId, amount: amt }),
                    error: function (xhr, status, error) {
                        alert("An error occurred during sending data: " + xhr);
                    }
                });
            }

            $(this).val(0);
        });

    });
});

