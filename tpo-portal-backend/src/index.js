const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler')
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// static serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

// health
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));

// your centralized error handler
app.use(errorHandler);