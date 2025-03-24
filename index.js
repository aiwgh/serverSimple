const bodyParser = require('body-parser');
const express = require('express');
const { createClient } = require('@vercel/edge-config');
const app = express();
app.use(bodyParser.json());

// Khởi tạo Edge Config client
const edgeConfig = createClient(process.env.EDGE_CONFIG);

// Hàm đọc dữ liệu
const readData = async () => {
    const users = await edgeConfig.get('users');
    return users || [];
};

// Hàm ghi dữ liệu
const saveData = async (users) => {
    await edgeConfig.set('users', users);
};

// Routes
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Hello World' });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await readData();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        res.json({ success: true, message: 'Login successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await readData();

        if (users.some(user => user.username === username)) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        users.push({ username, password });
        await saveData(users);
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/change-password', async (req, res) => {
    try {
        const { username, password, newPassword } = req.body;
        const users = await readData();
        const userIndex = users.findIndex(u =>
            u.username === username && u.password === password
        );

        if (userIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        users[userIndex].password = newPassword;
        await saveData(users);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        const users = await readData();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username'
            });
        }

        const tempPassword = generateRandomPassword();
        users[userIndex].password = tempPassword;
        await saveData(users);

        res.json({
            success: true,
            message: 'Temporary password generated',
            tempPassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Hàm tạo mật khẩu tạm
function generateRandomPassword() {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 8 }, () =>
        charset.charAt(Math.floor(Math.random() * charset.length))
    ).join('');
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});