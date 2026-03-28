const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const os = require('os');

const app = express();
app.use(express.json());

const PORT = 4000;
const SERVER_URL = "http://10.138.216.160:3000"; // 👉 change if needed

// 🔥 Function to get local IP dynamically
function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                !iface.address.startsWith('192.168.137') // 🚫 ignore hotspot
            ) {
                return iface.address;
            }
        }
    }
}

// Get IP
const ip = getLocalIP();

// Construct worker URL
const workerUrl = `http://${ip}:${PORT}`;

// 🧠 Unique worker ID (optional but useful)
const workerId = `${ip}-${Date.now()}`;

// 🔥 Register with server
async function registerWorker() {
    try {
        await axios.post(`${SERVER_URL}/register`, {
            workerUrl,
            workerId
        });

        console.log("✅ Registered with server:", workerUrl);

    } catch (err) {
        console.error("❌ Registration failed:", err.message);
    }
}

// Health check route
app.get('/', (req, res) => {
    res.send(`Worker running at ${workerUrl}`);
});

// Execute job
app.post('/execute', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    const fileName = `job_${Date.now()}.js`;
    const filePath = path.join(__dirname, 'jobs', fileName);

    // Save code
    fs.writeFileSync(filePath, code);

    // Execute code
    exec(`node ${filePath}`, (err, stdout, stderr) => {

        // Clean up
        fs.unlinkSync(filePath);

        if (err) {
            return res.json({
                status: "error",
                error: stderr
            });
        }

        res.json({
            status: "success",
            result: stdout,
            worker: workerUrl
        });
    });
    console.log(`Worker ${workerUrl} executing job`);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Worker running at ${workerUrl}`);

    // Register after server starts
    registerWorker();
});