const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const { get } = require('http');
const path = require('path');
const DataBasePatch = path.join(process.cwd(), 'simpleDataBase.json');
app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);

app.post('/login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var user = readData().users.find(u => u.username === username && u.password === password);
    if (!user) {
        res.status(400).send('Invalid username or password');
        return;
    }
    res.send('Login successful');

}
);

app.post('/register', (req, res) => {
    // var username = req.body.username;
    // var password = req.body.password;
    // if (username === 'admin') {
    //     res.status(400).send('username already exists');
    //     return;
    // }

    // res.send('Registration successful');
    var data = readData();
    var username = req.body.username;
    var password = req.body.password;
    var user = getUser(username);
    if (user) {
        res.status(400).send('username already exists');
        return;
    }
    data.users.push({ username: username, password: password });
    fs.writeFileSync(DataBasePatch, JSON.stringify(data));
    res.send('Registration successful');
}
);

app.post('/change-password', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var newPassword = req.body.newPassword;
    if (!changePassword(username, password, newPassword)) {
        res.status(400).send('Invalid username or password');
        return;
    }
    res.send('Password changed successfully');
}
);

app.post('/forgot-password', (req, res) => {
    var username = req.body.username;
    var user = getUser(username);
    if (!user) {
        res.status(400).send('Invalid username');
        return;
    }
    res.send(forgotPassword(username));
}
);



function generateRandomPassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        password = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
}


function changePassword(username, password, newPassword) {
    var data = readData();
    var user = data.users.find(u => u.username === username && u.password === password);
    if (!user) {
        return false;
    }
    user.password = newPassword;
    fs.writeFileSync(DataBasePatch, JSON.stringify(data));
    return true;
}

function forgotPassword(username) {
    var data = readData();
    var user = data.users.find(u => u.username === username);
    if (!user) {
        return null;
    }
    var tempPassword = generateRandomPassword();
    user.password = tempPassword;
    fs.writeFileSync(DataBasePatch, JSON.stringify(data));
    return tempPassword;
}








function readData() {
    var data = fs.readFileSync(DataBasePatch);
    return JSON.parse(data);
}

function getUser(username) {
    var data = readData();
    return data.users.find(u => u.username === username);
}












app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});