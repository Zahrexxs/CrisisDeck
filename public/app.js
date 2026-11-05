(function () {
    var JAKARTA = [-6.2, 106.816666];
    var map = L.map('map').setView(JAKARTA, 11);

    var reportLayer = L.layerGroup().addTo(map);
    var statusSpan = document.getElementById('status');
    var countSpan = document.getElementById('report-count');

    fetch('/api/config')
        .then(function (res) {
            return res.json();
        })
        .then(function (config) {
            L.tileLayer(config.tileUrl, {
                attribution: config.tileAttribution,
                maxZoom: config.tileMaxZoom || 19,
            }).addTo(map);
        })
        .catch(function () {
            console.error('Could not load map configuration');
        });

    function setStatus(text, color) {
        statusSpan.style.color = color;
        statusSpan.innerText = text;
    }

    function setReportCount(count) {
        if (!countSpan) {
            return;
        }
        countSpan.innerText = count + (count === 1 ? ' report' : ' reports');
    }

    function renderReports(reports) {
        var located = ReportView.normalizeReports(reports);
        reportLayer.clearLayers();
        setReportCount(located.length);

        if (located.length === 0) {
            return;
        }

        var bounds = L.latLngBounds([]);
        located.forEach(function (report) {
            L.circleMarker([report.latitude, report.longitude], {
                radius: 9,
                color: '#c0392b',
                weight: 2,
                fillColor: '#e74c3c',
                fillOpacity: 0.8,
            })
                .bindPopup(ReportView.popupHtml(report))
                .addTo(reportLayer);
            bounds.extend([report.latitude, report.longitude]);
        });

        map.fitBounds(bounds.pad(0.2), { maxZoom: 13 });
    }

    fetch('/api/health')
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            if (data.status === 'ok') {
                setStatus('Connected to Backend & DB', 'green');
            } else {
                setStatus('Error: ' + (data.error || 'unknown'), 'red');
            }
        })
        .catch(function () {
            setStatus('Backend Unreachable', 'red');
        });

    fetch('/api/reports?limit=100')
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            renderReports(data.reports || []);
        })
        .catch(function () {
            if (countSpan) {
                countSpan.innerText = 'Reports unavailable';
            }
        });
}());
