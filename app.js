import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Part for SQL scripts
import authRoutes from "./routes/auth.js";
import navigationRoutes from "./routes/navigation.js";
import calculsRoutes from "./routes/calculs.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: 'https://tpi26nde.mycpnv.ch', // L'URL du front-end
    //origin: 'http://localhost:3000',
    credentials: true
}));

// HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});

// API
app.use('/api', authRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/calculs', calculsRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré : http://localhost:${PORT}`);
});