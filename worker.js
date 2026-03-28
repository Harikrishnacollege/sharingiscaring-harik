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
                !iface.internal
            ) {
                // Prefer WiFi-like IPs
                if (
                    iface.address.startsWith('10.') ||
                    iface.address.startsWith('192.168.')
                ) {
                    return iface.address;
                }
            }
        }
    }

    // fallback (if nothing matched)
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
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
exec(`docker run --rm -v ${__dirname}/jobs:/app node:18 node /app/${fileName}`, 
(err, stdout, stderr) => {

    fs.unlinkSync(filePath);

    if (err) {
        return res.json({
            status: "error",
            error: stderr
        });
    }

    res.json({
        status: "success",
        result: stdout
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Worker running at ${workerUrl}`);

    // Register after server starts
    registerWorker();
});