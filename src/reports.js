const express = require('express');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_VICTIMS = 1000000;

function parseLimit(raw) {
    if (raw === undefined) {
        return { limit: DEFAULT_LIMIT };
    }
    if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
        return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
    }

    const limit = Number(raw);
    if (limit < 1 || limit > MAX_LIMIT) {
        return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
    }
    return { limit };
}

function validateReport(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { errors: ['request body must be a JSON object'], value: null };
    }

    const errors = [];
    const value = { description: null, victims: 0 };

    if (typeof body.title !== 'string' || body.title.trim() === '') {
        errors.push('title is required');
    } else if (body.title.trim().length > MAX_TITLE_LENGTH) {
        errors.push(`title must be ${MAX_TITLE_LENGTH} characters or fewer`);
    } else {
        value.title = body.title.trim();
    }

    if (body.description !== undefined && body.description !== null) {
        if (typeof body.description !== 'string') {
            errors.push('description must be a string');
        } else if (body.description.length > MAX_DESCRIPTION_LENGTH) {
            errors.push(`description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
        } else {
            value.description = body.description;
        }
    }

    if (typeof body.latitude !== 'number' || !Number.isFinite(body.latitude)) {
        errors.push('latitude must be a number');
    } else if (body.latitude < -90 || body.latitude > 90) {
        errors.push('latitude must be between -90 and 90');
    } else {
        value.latitude = body.latitude;
    }

    if (typeof body.longitude !== 'number' || !Number.isFinite(body.longitude)) {
        errors.push('longitude must be a number');
    } else if (body.longitude < -180 || body.longitude > 180) {
        errors.push('longitude must be between -180 and 180');
    } else {
        value.longitude = body.longitude;
    }

    if (body.victims !== undefined && body.victims !== null) {
        if (!Number.isInteger(body.victims) || body.victims < 0 || body.victims > MAX_VICTIMS) {
            errors.push(`victims must be an integer between 0 and ${MAX_VICTIMS}`);
        } else {
            value.victims = body.victims;
        }
    }

    return { errors, value: errors.length === 0 ? value : null };
}

function createReportsRouter(pool) {
    const router = express.Router();

    router.get('/', async (req, res, next) => {
        const { limit, error } = parseLimit(req.query.limit);
        if (error) {
            return res.status(400).json({ error });
        }

        try {
            const result = await pool.query(
                `SELECT id, title, description, latitude, longitude, victims, created_at
                 FROM reports
                 ORDER BY created_at DESC, id DESC
                 LIMIT $1`,
                [limit]
            );
            res.json({ reports: result.rows, count: result.rows.length });
        } catch (err) {
            next(err);
        }
    });

    router.post('/', async (req, res, next) => {
        const { errors, value } = validateReport(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        try {
            const result = await pool.query(
                `INSERT INTO reports (title, description, latitude, longitude, victims)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, title, description, latitude, longitude, victims, created_at`,
                [value.title, value.description, value.latitude, value.longitude, value.victims]
            );
            res.status(201).json({ report: result.rows[0] });
        } catch (err) {
            next(err);
        }
    });

    return router;
}

module.exports = { createReportsRouter, parseLimit, validateReport };
