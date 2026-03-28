const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const axios = require('axios');

const SERVER_URL = "http://10.138.216.160:3000";

// Register worker
axios.post(`${SERVER_URL}/register`, {
    workerUrl: "http://10.138.216.160:4000"
}).then(() => {
    console.log("Registered with server");
}).catch(err => {
    console.log("Registration failed");
});

app.use(express.json());

// Worker health check
app.get('/', (req, res) => {
    res.send('Worker running');
});

// Execute job
app.post('/execute', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    const fileName = `job_${Date.now()}.js`;
    const filePath = path.join(__dirname, 'jobs', fileName);

    fs.writeFileSync(filePath, code);

    exec(`node ${filePath}`, (err, stdout, stderr) => {

        fs.unlinkSync(filePath);

        if (err) {
            return res.json({ status: "error", error: stderr });
        }

        res.json({ status: "success", result: stdout });
    });
});

// Start worker server
app.listen(4000, '0.0.0.0', () => {
    console.log('Worker running on port 4000');
});