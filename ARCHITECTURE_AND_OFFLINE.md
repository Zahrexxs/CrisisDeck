# System Architecture

```ascii
       [User / Survivor]               [Admin / Staff]
              |                               |
              v                               v
      +-------------------------------------------+
      |               Nginx (Reverse Proxy)       |
      |   - SSL Termination                       |
      |   - Static Asset Caching (Gzip/Brotli)    |
      |   - Rate Limiting / Security Headers      |
      +---------------------+---------------------+
                            |
           +----------------v----------------+
           |                                 |
           |      Node.js App (Express)      |
           |   [Port 3000]                   |
           |   - API Routes                  |
           |   - Leaflet/Frontend Serving    |
           |   - Input Validation            |
           |                                 |
           +----------------+----------------+
                            |
           +----------------v----------------+
           |                                 |
           |    PostgreSQL                   |
           |   [Port 5432]                   |
           |   - Disaster Reports Data       |
           |   - Coordinates (lat/long)      |
           |   - Authenticated Users         |
           |                                 |
           +---------------------------------+
```

# Offline Leaflet Caching Strategies

For a disaster mitigation center, internet connectivity might be unreliable. Here are strategies to cache Leaflet tiles for offline use:

## 1. Browser Caching (Service Workers)

The most modern approach is to use a PWA (Progressive Web App) approach with a Service Worker to cache tile images.

**Implementation:**

1. Register a Service Worker in your `index.html`.
2. In the Service Worker, intercept `fetch` requests to the tile server (e.g., `openstreetmap.org`).
3. Cache the responses in the `CacheStorage` API.

## 2. Local Tile Server (Dockerized)

Instead of relying on OpenStreetMap's public servers, you can host a lightweight tile server container.

**Tools:**

- **mbtiles**: A file format for storing map tiles.
- **Tileserver-GL** or **Node-mbtiles**.

**Docker Setup:**
Add this to your `docker-compose.yml`:

```yaml
  tileserver:
    image: maptiler/tileserver-gl
    volumes:
      - ./docker/tiles:/data
    ports:
      - "8080:8080"
```

*Note: You will need to download the `.mbtiles` file for your specific region (e.g., Indonesia) from OpenMapTiles or similar sources.*

## 3. Leaflet.offline Plugin

There is a specific library for Leaflet that handles local storage (IndexedDB) for tiles.

**Usage:**

1. Include the script: `leaflet.offline.js`
2. Configure the layer:

```javascript
const tileLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    localCache: true,
    saveToCache: true
}).addTo(map);
```
