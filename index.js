const http = require("http");
const fs = require("fs");
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const cookie = require('cookie'); // Import cookie for cookie handling
const path = require("path");

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

    con.query("USE KafeDB;", function (err, result, fields) {
        if (err) throw err;
    });
});

http.createServer((req, res) => {
    try {
        res.setHeader("Content-Type", "application/json");

        // Middleware to check authentication
        const isAuthenticated = (req) => {
            const cookies = cookie.parse(req.headers.cookie || '');
            return cookies.userId ? true : false; // Check if userId cookie exists
        };

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

                    // Set the authentication cookie with the user ID
                    res.setHeader('Set-Cookie', cookie.serialize('userId', id, {
                        httpOnly: true,
                        secure: false, // Set to true if using HTTPS
                        maxAge: 3600,
                        path: '/'
                    }));

                    const target = req.url.split("&")[0];
                    console.log(target);

                    if (target == "/login") {
                        res.writeHead(302, {
                            "Location": "/index.html",
                            "X-Custom-Redirect-Header": "Redirecting to new path"
                        });
                        res.end();
                        return;
                    }

                    // Handle API commands
                    handleApiCommands(target, res, id);
                });
            });
        } else if (req.method === "GET") {
            console.log(req.url)
            if (req.url === "/login") {
                if (isAuthenticated(req)) {
                    res.writeHead(302, {
                        "Location": "/index.html",
                        "X-Custom-Redirect-Header": "Redirecting to new path"
                    });
                    res.end();
                    return;
                }
                handleFileRequest(req, res, 'text/html', './client/login.html');
            } else if (req.url === '/clientLogin.js') {
                handleFileRequest(req, res, 'text/javascript', './client/clientLogin.js');
            } else if (req.url === '/style.css') {
                handleFileRequest(req, res, 'text/css', './client/style.css');
            } else if (req.url === "/coffee.png") {
                const imagePath = path.join(__dirname, 'client', req.url);
                serveImage(req, res, imagePath);
            } else if (isAuthenticated(req)) {
                const filePath = `./client${req.url}`;
                handleFileRequest(req, res, 'text/html', filePath);
            } else {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ "msg": "Authentication required" }));
                res.end();
            }
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

function handleApiCommands(target, res, id) {
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
}

function serveImage(req, res, imagePath) {
    const extname = path.extname(imagePath).toLowerCase();
    let contentType = 'image/jpeg'; // Default to JPEG

    switch (extname) {
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
        case '.webp':
            contentType = 'image/webp';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
        default:
            res.writeHead(415, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ "msg": "Unsupported image format" }));
            res.end();
            return;
    }

    fs.readFile(imagePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Image not found");
            return;
        }
        res.setHeader("Content-Type", contentType);
        res.end(data);
    });
}