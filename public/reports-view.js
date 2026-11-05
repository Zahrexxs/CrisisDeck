(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ReportView = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isValidCoordinate(value, min, max) {
        return typeof value === 'number' && isFinite(value) && value >= min && value <= max;
    }

    function normalizeReports(reports) {
        if (!Array.isArray(reports)) {
            return [];
        }
        return reports.filter(function (report) {
            return report &&
                isValidCoordinate(report.latitude, -90, 90) &&
                isValidCoordinate(report.longitude, -180, 180);
        });
    }

    function formatDate(value) {
        if (!value) {
            return '';
        }
        var date = new Date(value);
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleString();
    }

    function popupHtml(report) {
        var html = '<strong>' + escapeHtml(report.title) + '</strong>';
        if (report.description) {
            html += '<br>' + escapeHtml(report.description);
        }
        var victims = Number.isFinite(report.victims) ? report.victims : 0;
        html += '<br><small>Victims: ' + escapeHtml(victims) + '</small>';
        var created = formatDate(report.created_at);
        if (created) {
            html += '<br><small>' + escapeHtml(created) + '</small>';
        }
        return html;
    }

    return {
        escapeHtml: escapeHtml,
        normalizeReports: normalizeReports,
        formatDate: formatDate,
        popupHtml: popupHtml,
    };
}));
