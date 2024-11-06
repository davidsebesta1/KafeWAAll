CREATE DATABASE KafeDB;
USE KafeDB;

CREATE TABLE ItemType(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ItemName VARCHAR(50) NOT NULL UNIQUE,
    StoredAmount INT NOT NULL CHECK(StoredAmount > 0)
);

INSERT INTO ItemType(ItemName, StoredAmount) VALUES("Mléko", 50);
INSERT INTO ItemType(ItemName, StoredAmount) VALUES("Espresso", 50);
INSERT INTO ItemType(ItemName, StoredAmount) VALUES("Coffe", 50);
INSERT INTO ItemType(ItemName, StoredAmount) VALUES("Long", 50);
INSERT INTO ItemType(ItemName, StoredAmount) VALUES("Doppio+", 50);

CREATE TABLE User(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

INSERT INTO User(FirstName, LastName, Username, Password) VALUES('David', 'Sebesta', 'davidseb', '$2b$10$ueX\WEjmXcO986WlE7RJjO4kr6VLQ0xlDX75NGQ\plUl69zK74AKW');
INSERT INTO User(FirstName, LastName, Username, Password) VALUES('Admin', 'Admin', 'admin', '$2b$10$ueX\WEjmXcO986WlE7RJjO4kr6VLQ0xlDX75NGQ\plUl69zK74AKW');

CREATE TABLE UsageEntry(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ItemType_ID INT NOT NULL,
    User_ID INT NOT NULL,
    Amount INT NOT NULL CHECK(Amount > 0),
    Date DATE NOT NULL DEFAULT(CURDATE()),
    FOREIGN KEY (ItemType_ID) REFERENCES ItemType(ID),
    FOREIGN KEY (User_ID) REFERENCES User(ID)
);

DELIMITER $$

CREATE TRIGGER UsageEntryEnoughPreCheck
BEFORE INSERT ON UsageEntry
FOR EACH ROW
BEGIN
    DECLARE currentAmount INT;

    -- Get the current amount of the item being used
    SELECT StoredAmount INTO currentAmount
    FROM ItemType
    WHERE ID = NEW.ItemType_ID;

    -- Check if the current amount is sufficient
    IF currentAmount < NEW.Amount THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stored amount for this item.';
    ELSE
        -- If sufficient, decrease the amount in ItemType
        UPDATE ItemType
        SET StoredAmount = StoredAmount - NEW.Amount
        WHERE ID = NEW.ItemType_ID;
    END IF;
END$$

DELIMITER ;

INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(1, 1, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(3, 1, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(2, 1, 2);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(1, 1, 2);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(4, 2, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(1, 2, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(5, 2, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(5, 2, 1);
INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(3, 2, 1);

CREATE TABLE Task(
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    User_ID INT,
    TaskDone BIT NOT NULL,
    Header VARCHAR(50),
    Description VARCHAR(255),
    FOREIGN KEY (User_ID) REFERENCES User(ID)
);

INSERT INTO Task(User_ID,TaskDone,Header,Description) VALUES(1, 1, 'Vyčistit kávovar', 'Ftest');
INSERT INTO Task(User_ID,TaskDone,Header,Description) VALUES(null, 0, 'Vyčistit kávovar', 'Yes');

CREATE USER 'testUser'@'localhost' IDENTIFIED BY 'MyPassword123!';
GRANT SELECT,INSERT ON KafeDB.* TO 'testUser'@'localhost';
FLUSH PRIVILEGES;

SELECT User.ID as UserID,FirstName,LastName,ItemType.ItemName,SUM(Amount) AS Amount
FROM UsageEntry
INNER JOIN User ON UsageEntry.User_ID = User.ID 
INNER JOIN ItemType ON UsageEntry.ItemType_ID = ItemType.ID
GROUP BY User.ID,FirstName,LastName,ItemType.ItemName;

INSERT INTO UsageEntry(ItemType_ID, User_ID, Amount) VALUES(1, 1, 1);

-- sudo mysql --defaults-file=/etc/mysql/debian.cnf
-- takhle se zapíná mysql na debianu