const bodyParser = require('body-parser');
const express = require('express');
const { createClient, get } = require('@vercel/edge-config');
const fetch = require('node-fetch');
const { Groq } = require('groq-sdk');
require('dotenv').config({ path: '.env.local' })

const app = express();
app.use(bodyParser.json());

// Khởi tạo Edge Config client
const edgeConfig = createClient(process.env.EDGE_CONFIG);
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const API_URL = `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}}/items`;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Hàm đọc dữ liệu
const readData = async () => {
    const users = await edgeConfig.get('users');
    return users || [];
};

// Hàm cập nhật dữ liệu
const saveData = async (users) => {
    const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: [
                {
                    operation: 'upsert',
                    key: 'users',
                    value: users
                }
            ]
        })
    });

    if (!response.ok) return false;
    return true;
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
        else {
            res.json({ success: true, message: 'Login successful' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Endpoint đăng ký
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await readData();

        // Kiểm tra user tồn tại
        if (users.some(user => user.username === username)) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Thêm user mới
        users.push({ username, password });
        if (await saveData(users)) {
            return res.status(500).json({
                success: false,
                message: 'Failed to save data'
            });
        }
        else {
            res.json({
                success: true,
                message: 'Registration successful'
            });
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
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



// endpoint Ai chatbot
app.post('/chatbot', async (req, res) => {
    const { message } = req.body;
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: message }
            ]
        });

        res.status(200).json({ message: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
);


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