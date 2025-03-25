const bodyParser = require('body-parser');
const express = require('express');
const { createClient } = require('@vercel/edge-config');
const fetch = require('node-fetch');
const { Groq } = require('groq-sdk');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(bodyParser.json());

const edgeConfig = createClient(process.env.EDGE_CONFIG);
const VERCEL_ACCESS_TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const API_URL = `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const readData = async () => {
    try {
        const users = await edgeConfig.get('users');
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

const saveData = async (users) => {
    try {
        const response = await fetch(API_URL, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${VERCEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [{ operation: 'upsert', key: 'users', value: users }]
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
};

app.get('/', (req, res) => {
    res.json({ success: true, message: 'Hello World' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readData();
    const user = users.find(u => u.username === username && u.password === password);
    return res.json(user ? { success: true, message: 'Login successful' } : { success: false, message: 'Invalid username or password' });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = await readData();
    if (users.some(user => user.username === username)) {
        return res.json({ success: false, message: 'Username already exists' });
    }
    users.push({ username, password });
    return res.json(await saveData(users) ? { success: true, message: 'Registration successful' } : { success: false, message: 'Failed to save data' });
});

app.post('/change-password', async (req, res) => {
    const { username, password, newPassword } = req.body;
    const users = await readData();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });
    user.password = newPassword;
    return res.json(await saveData(users) ? { success: true, message: 'Password changed successfully' } : { success: false, message: 'Failed to update password' });
});

app.post('/forgot-password', async (req, res) => {
    const { username } = req.body;
    const users = await readData();
    const user = users.find(u => u.username === username);
    if (!user) return res.json({ success: false, message: 'Invalid username' });
    user.password = generateRandomPassword();
    return res.json(await saveData(users) ? { success: true, message: 'Temporary password generated', tempPassword: user.password } : { success: false, message: 'Failed to reset password' });
});

app.post('/chatbot', async (req, res) => {
    const { message } = req.body;
    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: message }]
        });
        res.status(200).json({ message: response.choices[0].message.content });
    } catch (error) {
        res.json({ error: error.message });
    }
});

function generateRandomPassword() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 8 }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});