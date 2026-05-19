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
app.set('trust proxy', 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json());
app.use(cors({
    origin: 'https://tpi26nde.mycpnv.ch', // L'URL du front-end
    //origin: 'http://localhost:3000',
    credentials: true
}));

// Accès dossier public/
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes HTMl pour les pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});
app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/home.html'));
});
app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/settings.html'));
});
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/admin.html'));
});
// Garde aussi l'ancienne route /admin au cas où
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