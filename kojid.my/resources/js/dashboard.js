import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// ── Working Capital Trend (line chart) ───────────────────────────────────────
export function initWorkingCapitalChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Modal Kerja (RM)',
                data,
                borderColor:     '#16a34a',
                backgroundColor: 'rgba(22,163,74,0.08)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#16a34a',
                tension: 0.4,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => 'RM ' + parseFloat(ctx.raw).toLocaleString('ms-MY', {
                            minimumFractionDigits: 2,
                        }),
                    },
                },
            },
            scales: {
                x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
                y: {
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: {
                        font: { size: 11 },
                        callback: v => 'RM ' + (v / 1000).toFixed(0) + 'k',
                    },
                },
            },
        },
    });
}

// ── Order status breakdown (doughnut) ────────────────────────────────────────
export function initOrderStatusChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#16a34a', '#d97706', '#dc2626',
                    '#64748b', '#0ea5e9', '#8b5cf6',
                ],
                borderWidth: 0,
                hoverOffset: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { size: 11 }, padding: 12, usePointStyle: true },
                },
            },
        },
    });
}

// ── Daily margin bar chart ────────────────────────────────────────────────────
export function initMarginChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Margin Kasar (RM)',
                data,
                backgroundColor: data.map(v => v >= 0 ? 'rgba(22,163,74,0.7)' : 'rgba(220,38,38,0.7)'),
                borderRadius: 4,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { callback: v => 'RM ' + (v/1000).toFixed(1) + 'k', font: { size: 11 } },
                },
            },
        },
    });
}
