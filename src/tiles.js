const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_TILE_MAX_ZOOM = 19;

function getTileConfig(env = process.env) {
    const configuredZoom = Number(env.TILE_MAX_ZOOM);
    const maxZoom = Number.isInteger(configuredZoom) && configuredZoom > 0
        ? configuredZoom
        : DEFAULT_TILE_MAX_ZOOM;

    return {
        url: env.TILE_URL || DEFAULT_TILE_URL,
        attribution: env.TILE_ATTRIBUTION || DEFAULT_TILE_ATTRIBUTION,
        maxZoom,
    };
}

function tileCspSources(tileUrl) {
    try {
        const concrete = String(tileUrl)
            .replace(/\{s\}/g, 'a')
            .replace(/\{r\}/g, '')
            .replace(/\{z\}/g, '0')
            .replace(/\{x\}/g, '0')
            .replace(/\{y\}/g, '0');
        const parsed = new URL(concrete);

        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return [];
        }

        const labels = parsed.hostname.split('.');
        if (String(tileUrl).includes('{s}') && labels.length > 2) {
            return [`${parsed.protocol}//*.${labels.slice(1).join('.')}`];
        }

        return [parsed.origin];
    } catch (err) {
        return [];
    }
}

module.exports = {
    DEFAULT_TILE_URL,
    DEFAULT_TILE_ATTRIBUTION,
    DEFAULT_TILE_MAX_ZOOM,
    getTileConfig,
    tileCspSources,
};
