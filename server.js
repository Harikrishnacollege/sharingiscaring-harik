const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Hardcoded worker (for now)
app.post('/submit-job', async (req, res) => {
    if (workers.length === 0) {
        return res.status(500).json({ error: "No workers available" });
    }

    const { code } = req.body;

    // simple scheduler (pick first worker)
    const worker = workers[0];

    try {
        const response = await axios.post(`${worker}/execute`, { code });

        res.json(response.data);

    } catch (error) {
        res.status(500).json({ error: "Worker failed" });
    }
});


let workers = [];

// Register worker
app.post('/register', (req, res) => {
    const { workerUrl } = req.body;

    workers.push(workerUrl);
    console.log("Worker registered:", workerUrl);

    res.json({ status: "registered" });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});