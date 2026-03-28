const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

let workers = [];
let currentIndex = 0; // for round-robin scheduling

// 🔥 Register worker
app.post('/register', (req, res) => {
    const { workerUrl } = req.body;

    // avoid duplicates
    if (!workers.includes(workerUrl)) {
        workers.push(workerUrl);
        console.log("✅ Worker registered:", workerUrl);
    }

    res.json({ status: "registered" });
});

// 🔥 Submit job
app.post('/submit-job', async (req, res) => {
    if (workers.length === 0) {
        return res.status(500).json({ error: "No workers available" });
    }

    const { code } = req.body;

    // 🧠 Round-robin scheduler
    const worker = workers[currentIndex];
    currentIndex = (currentIndex + 1) % workers.length;

    console.log("📤 Assigning job to:", worker);
    console.log("📊 Available workers:", workers);

    try {
        const response = await axios.post(`${worker}/execute`, { code });

        res.json({
            ...response.data,
            assignedWorker: worker
        });

    } catch (error) {
        console.error("❌ Worker failed:", worker);

        res.status(500).json({
            error: "Worker failed",
            worker
        });
    }
});

// 🔥 Optional: View workers
app.get('/workers', (req, res) => {
    res.json({ workers });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Server running on port 3000');
});