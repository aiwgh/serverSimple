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
    var userName = req.body.userName;
    var password = req.body.password;
    var user = readData().users.find(u => u.userName === userName && u.password === password);
    if (!user) {
        res.status(400).send('Invalid username or password');
        return;
    }
    res.send('Login successful');

}
);

app.post('/register', (req, res) => {
    // var userName = req.body.userName;
    // var password = req.body.password;
    // if (userName === 'admin') {
    //     res.status(400).send('Username already exists');
    //     return;
    // }

    // res.send('Registration successful');
    var data = readData();
    var userName = req.body.userName;
    var password = req.body.password;
    var user = getUser(userName);
    if (user) {
        res.status(400).send('Username already exists');
        return;
    }
    data.users.push({ userName: userName, password: password });
    fs.writeFileSync(DataBasePatch, JSON.stringify(data));
    res.send('Registration successful');
}
);

app.post('/change-password', (req, res) => {
    var userName = req.body.userName;
    var password = req.body.password;
    var newPassword = req.body.newPassword;
    if (!changePassword(userName, password, newPassword)) {
        res.status(400).send('Invalid username or password');
        return;
    }
    res.send('Password changed successfully');
}
);

app.post('/forgot-password', (req, res) => {
    var userName = req.body.userName;
    var user = getUser(userName);
    if (!user) {
        res.status(400).send('Invalid username');
        return;
    }
    res.send(forgotPassword(userName));
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


function changePassword(userName, password, newPassword) {
    var data = readData();
    var user = data.users.find(u => u.userName === userName && u.password === password);
    if (!user) {
        return false;
    }
    user.password = newPassword;
    fs.writeFileSync(DataBasePatch, JSON.stringify(data));
    return true;
}

function forgotPassword(userName) {
    var data = readData();
    var user = data.users.find(u => u.userName === userName);
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

function getUser(userName) {
    var data = readData();
    return data.users.find(u => u.userName === userName);
}












app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});