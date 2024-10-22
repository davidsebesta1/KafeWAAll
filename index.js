const http = require("http");
const fs = require("fs");
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
var mysql = require('mysql2');

const listeningIp = "0.0.0.0";
const listeningPort = 8082;

let con = mysql.createConnection({
    host: "localhost",
    user: "testUser",
    password: "MyPassword123!",
    insecureAuth: true
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");

    saltRounds = 10;

    /*
    bcrypt.hash("test1", saltRounds, function(err, hashedPassword) {
        if (err) {
            console.error("Error hashing password:", err);
            return;
        }
        
        // Store the hashed password in your database
        console.log("Hashed password:", hashedPassword);
    });
    */

    con.query("USE KafeDB;", function (err, result, fields) {
        if (err) throw err;
    });
});

http.createServer((req, res) => {
    try {
        res.setHeader("Content-Type", "application/json");

        if (req.method === "POST") {
            let body = "";

            req.on("data", chunk => {
                body += chunk.toString();
            });

            req.on("end", () => {
                let requestData;
                try {
                    console.log(body);
                    requestData = JSON.parse(body);
                } catch (error) {
                    res.write(JSON.stringify({ "msg": "Invalid JSON format" }));
                    res.end();
                    return;
                }

                const username = requestData.username;
                const password = requestData.password;

                authenticateUser(username, password, (authValid, id) => {
                    if (!authValid) {
                        res.write(JSON.stringify({ "msg": "Invalid credentials" }));
                        res.end();
                        return;
                    }

                    const target = req.url.split("&")[0];
                    console.log(target);

                    switch (target) {
                        case "/api?cmd=getItemTypeList":
                            con.query("SELECT * FROM ItemType", function (err, result, fields) {
                                if (err) throw err;
                                res.write(JSON.stringify(result));
                                res.end();
                            });
                            break;

                        case "/api?cmd=getUsers":
                            con.query("SELECT * FROM User", function (err, result, fields) {
                                if (err) throw err;
                                res.write(JSON.stringify(result));
                                res.end();
                            });
                            break;

                        case "/api?cmd=getTasks":
                            con.query("SELECT FirstName,LastName,Header,Description,TaskDone FROM Task INNER JOIN User ON Task.User_ID = User.ID;", function (err, result, fields) {
                                if (err) throw err;
                                res.write(JSON.stringify(result));
                                res.end();
                            });
                            break;

                        case "/api?cmd=getCoffeeUsage":
                            con.query("SELECT User.ID as UserID,FirstName,LastName,ItemType.ItemName,SUM(Amount) AS Amount FROM UsageEntry INNER JOIN User ON UsageEntry.User_ID = User.ID INNER JOIN ItemType ON UsageEntry.ItemType_ID = ItemType.ID GROUP BY User.ID,FirstName,LastName,ItemType.ItemName;", function (err, result, fields) {
                                if (err) throw err;
                                res.write(JSON.stringify(result));
                                res.end();
                            });
                            break;

                        case "/api?cmd=addEntry":
                            let itemID = requestData.itemId;
                            let amount = requestData.amount;
                            console.log(itemID);
                            console.log(id);
                            console.log(amount);
                            con.query("INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(?, ?, ?);", [itemID, id, amount], function (err, result, fields) {
                                if (err) {
                                    res.write(JSON.stringify({ "msg": 1, "err": err }));
                                    res.end();
                                    return;
                                }
                                res.write(result.affectedRows == 0 ? JSON.stringify({ "msg": 1, "err": "No row affected" }) : JSON.stringify({ "msg": 0 }));
                                res.end();
                            });
                            break;


                        default:
                            res.writeHead(404, { "Content-Type": "application/json" });
                            res.write(JSON.stringify({ "msg": "Invalid API command" }));
                            res.end();
                            break;
                    }
                });
            });
        } else {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ "msg": "Only POST requests are allowed" }));
            res.end();
        }

    } catch (exception) {
        console.log(exception);
        res.write(JSON.stringify({ "msg": exception }));
        res.end();
    }


}).listen(listeningPort, listeningIp, () => {
    console.log("Server is running on " + listeningIp + ":" + listeningPort);
});

function handleFileRequest(req, res, fileType, path) {
    res.setHeader("Content-Type", fileType);
    fs.readFile(path, "utf8", (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end("Error loading");
            return;
        }
        res.write(data);
        res.end();
    });
}

function authenticateUser(username, password, callback) {
    if (!username || !password) {
        callback(false, null);
        return;
    }

    const query = "SELECT ID, Password FROM User WHERE Username = ?";

    con.query(query, [username], (err, result) => {
        if (err) {
            console.log(err);
            callback(false, null);
            return;
        }

        if (result.length === 0) {
            callback(false, null);
        } else {
            const storedHashedPassword = result[0].Password;
            const id = result[0].ID;

            bcrypt.compare(password, storedHashedPassword, (err, isMatch) => {
                if (err) {
                    console.log(err);
                    callback(false, id);
                } else if (isMatch) {
                    callback(true, id);
                } else {
                    callback(false, id);
                }
            });
        }
    });
}