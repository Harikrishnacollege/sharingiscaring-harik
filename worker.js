const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const os = require('os');

const app = express();
app.use(express.json());

const PORT = 4000;
const SERVER_URL = "http://10.138.216.160:3000"; // change if needed

// 🔥 Get local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (
                    iface.address.startsWith('10.') ||
                    iface.address.startsWith('192.168.')
                ) {
                    return iface.address;
                }
            }
        }
    }

    // fallback
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
}

const ip = getLocalIP();
const workerUrl = `http://${ip}:${PORT}`;
const workerId = `${ip}-${Date.now()}`;

// 🔥 Register worker
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

// Health check
app.get('/', (req, res) => {
    res.send(`Worker running at ${workerUrl}`);
});

// 🚀 EXECUTE JOB (FIXED)
app.post('/execute', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    const fileName = `job_${Date.now()}.js`;
    const filePath = path.join(__dirname, 'jobs', fileName);

    // Save file
    fs.writeFileSync(filePath, code);

    console.log(`🧠 Executing job on ${workerUrl}`);

    // 🔥 DOCKER EXECUTION
    const command = `docker run --rm -v ${__dirname}/jobs:/app node:18 node /app/${fileName}`;

    exec(command, (err, stdout, stderr) => {

        // delete file
        fs.unlinkSync(filePath);

        if (err) {
            return res.json({
                status: "error",
                error: stderr,
                worker: workerUrl
            });
        }

        res.json({
            status: "success",
            result: stdout,
            worker: workerUrl
        });
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Worker running at ${workerUrl}`);
    registerWorker();
});