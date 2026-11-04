-- Create a sample table for disaster reports.
-- The deployment uses plain PostgreSQL, so coordinates are stored as decimals
-- (no PostGIS / GEOMETRY column required).
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    victims INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy data only when the table is empty (safe on re-runs).
INSERT INTO reports (title, description, latitude, longitude, victims)
SELECT 'Flood in Jakarta', 'Severe flooding in downtown area', -6.200000, 106.816666, 120
WHERE NOT EXISTS (SELECT 1 FROM reports);
