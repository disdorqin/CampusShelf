/**
 * CampusShelf Admin — Chart.js 图表初始化
 */
(function () {
  'use strict';

  // Helper: create or get canvas context
  function ctx(id) {
    var c = document.getElementById(id);
    return c ? c.getContext('2d') : null;
  }

  // Trend chart (used in dashboard + stats)
  if (typeof trendData !== 'undefined' && ctx('trendChart')) {
    new Chart(ctx('trendChart'), {
      type: 'line',
      data: {
        labels: trendData.map(function (d) { return d.date; }),
        datasets: [{
          label: '发布数',
          data: trendData.map(function (d) { return d.count; }),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Category pie chart (dashboard + stats)
  if (typeof catData !== 'undefined' && ctx('catChart')) {
    new Chart(ctx('catChart'), {
      type: 'doughnut',
      data: {
        labels: catData.map(function (d) { return d.label; }),
        datasets: [{
          data: catData.map(function (d) { return d.value; }),
          backgroundColor: ['#4F46E5','#059669','#DC2626','#0891B2','#7C3AED','#D97706'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } }
        }
      }
    });
  }

  // Order trend chart (stats page only)
  if (typeof orderTrendData !== 'undefined' && ctx('orderChart')) {
    new Chart(ctx('orderChart'), {
      type: 'bar',
      data: {
        labels: orderTrendData.map(function (d) { return d.date; }),
        datasets: [{
          label: '成交数',
          data: orderTrendData.map(function (d) { return d.count; }),
          backgroundColor: 'rgba(5,150,105,0.6)',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 4
        }, {
          label: '成交额(元)',
          data: orderTrendData.map(function (d) { return d.amount; }),
          backgroundColor: 'rgba(79,70,229,0.3)',
          borderColor: '#4F46E5',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, position: 'left', title: { display: true, text: '笔数' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '金额' } }
        }
      }
    });
  }

})();
