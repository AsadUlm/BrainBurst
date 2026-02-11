const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const gameRoutes = require('./routes/gameRoutes');
const createDefaultAdmin = require('./middleware/createDefaultAdmin');

const app = express();
const PORT = 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/games', gameRoutes);
createDefaultAdmin();

const clientPath = path.join(__dirname, "./frontend/dist");

/* app.get('/', (req, res) => {
    res.send('BrainBurst API working!');
}); */

app.use(express.static(clientPath));
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});


app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`Server started on http://localhost:${PORT}`);
    console.log('📦 Project version: 3.1.3');
    console.log('==========================================');
});
