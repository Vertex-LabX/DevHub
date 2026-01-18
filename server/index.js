const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Data Path
const DATA_FILE = path.join(__dirname, 'data', 'projects.json');

// Helper to read data
const getProjects = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading projects:", err);
        return [];
    }
};

// API: Get all projects (supports filtering by category via query)
app.get('/api/projects', (req, res) => {
    const projects = getProjects();
    const { category } = req.query;

    if (category && category !== 'All') {
        const filtered = projects.filter(p => p.category.toLowerCase() === category.toLowerCase());
        return res.json(filtered);
    }

    res.json(projects);
});

// API: Get categories
app.get('/api/categories', (req, res) => {
    const projects = getProjects();
    const categories = new Set(projects.map(p => p.category));
    // Always include 'All' and sort
    const sortedCategories = ['All', ...Array.from(categories).sort()];
    res.json(sortedCategories);
});

// Fallback to index.html for any other route
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
