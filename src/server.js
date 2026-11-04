require('dotenv').config();

const createApp = require('./app');
const { pool, testDbConnection } = require('../config/db');

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

testDbConnection();

let shuttingDown = false;

function shutdown(signal) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    console.log(`${signal} received: closing HTTP server`);

    const forceExit = setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async (err) => {
        if (err) {
            console.error('Error closing HTTP server:', err);
            process.exitCode = 1;
        }

        try {
            await pool.end();
            console.log('Database pool closed');
        } catch (poolErr) {
            console.error('Error closing database pool:', poolErr);
            process.exitCode = 1;
        }

        clearTimeout(forceExit);
        process.exit(process.exitCode || 0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
