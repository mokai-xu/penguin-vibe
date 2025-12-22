const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client directory
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Also serve assets directory
const assetsPath = path.join(__dirname, '../assets');
app.use('/assets', express.static(assetsPath));

// Serve index.html for all routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

