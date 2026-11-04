(function () {
    var map = L.map('map').setView([-6.2, 106.816666], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    var statusSpan = document.getElementById('status');

    function setStatus(text, color) {
        statusSpan.style.color = color;
        statusSpan.innerText = text;
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
}());
