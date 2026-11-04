const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

function createApp({ db, enableLogging = true } = {}) {
    // Resolve the pool lazily so tests can inject a stub without opening a real connection.
    const pool = db || require('../config/db').pool;

    const app = express();

    // Set to "1" so express-rate-limit sees the real client IP when running behind one nginx hop.
    app.set('trust proxy', 1);
    app.disable('x-powered-by');

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'https://unpkg.com'],
                styleSrc: ["'self'", 'https://unpkg.com'],
                imgSrc: ["'self'", 'data:', 'https://unpkg.com', 'https://*.tile.openstreetmap.org'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'self'"],
            },
        },
    }));
    app.use(compression());
    app.use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false,
    }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    if (enableLogging) {
        app.use(morgan('combined'));
    }

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', limiter);

    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/api/health', async (req, res) => {
        try {
            const dbRes = await pool.query('SELECT NOW() AS now');
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
                db_time: dbRes.rows[0].now,
            });
        } catch (err) {
            console.error('Health check failed:', err.message);
            res.status(500).json({
                status: 'error',
                database: 'disconnected',
                error: 'Database connection failed',
            });
        }
    });

    // Unknown API routes must not fall through to the SPA.
    app.use('/api', (req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    // Serve the dashboard for every non-API route.
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    app.use((err, req, res, next) => {
        console.error(err);
        if (res.headersSent) {
            return next(err);
        }
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}

module.exports = createApp;
