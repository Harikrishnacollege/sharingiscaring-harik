const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Hardcoded worker (for now)
const WORKER_URL = "http://localhost:4000/execute";

// Submit job
app.post('/submit-job', async (req, res) => {
    const { code } = req.body;

    try {
        const response = await axios.post(WORKER_URL, { code });

        res.json({
            from: "worker",
            ...response.data
        });

    } catch (error) {
        res.status(500).json({ error: "Worker failed" });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});