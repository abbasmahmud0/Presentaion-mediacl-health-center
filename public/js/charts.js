// Get the carousel elements
const carousel = document.getElementById('charts-carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Calculate the number of charts and the slide distance
const charts = document.querySelectorAll('#charts-carousel .modern-chart-card');
let currentIndex = 0;
const chartsPerView = 2; // Set how many charts you want to see at once
const slideDistance = 100 / chartsPerView; // 100% divided by charts per view

// Function to update the carousel position
function updateCarousel() {
    const offset = -currentIndex * slideDistance;
    carousel.style.transform = `translateX(${offset}%)`;

    // Disable/enable the previous button at the start of the carousel
    prevBtn.disabled = currentIndex === 0;
    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
}

// Event listener for the "Next" button
nextBtn.addEventListener('click', () => {
    // If we're at the last item, loop back to the beginning
    if (currentIndex >= charts.length - chartsPerView) {
        currentIndex = 0;
    } else {
        currentIndex++;
    }
    updateCarousel();
});

// Event listener for the "Previous" button
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

// Initialize the carousel on page load
document.addEventListener('DOMContentLoaded', updateCarousel);





// Charts functionality for Rivers MedMap Analytics
class ChartsHandler {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.chartColors = [
            '#60B5FF', '#FF9149', '#FF9898', '#FF90BB', 
            '#FF6363', '#80D8C3', '#A19AD3', '#72BF78'
        ];
    }

    initializeCharts() {
        try {
            // Only initialize if we have stats data
            if (!this.app.currentStats) {
                console.warn('No stats data available for charts');
                return;
            }

            this.createFacilityTypeChart();
            this.createOwnershipChart();
            this.createStaffChart();
            this.createLGAChart();
            this.createEmergencyChart();
            this.createTwentyFourSevenChart();
            this.createCapacityChart();
            this.createRatingsChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    createFacilityTypeChart() {
        const canvas = document.getElementById('facilityTypeChart');
        if (!canvas || !this.app.currentStats?.byType) return;

        // Destroy existing chart if it exists
        if (this.charts.facilityType) {
            this.charts.facilityType.destroy();
        }

        const ctx = canvas.getContext('2d');
        const data = this.app.currentStats.byType;

        // Define colors for specific facility types
        const facilityTypeColors = {
            'Healt Post (HP)': '#22c55e',
            'HealtHClinic (PHC)': '#3b82f6',
            'Model Primary HealtHCentre (MPHC)': '#f59e0b',
        };

        const labels = Object.keys(data);
        const values = Object.values(data);
        const backgroundColors = labels.map(label => 
            facilityTypeColors[label] || this.chartColors[0]
        );

        this.charts.facilityType = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverOffset: 20,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 11,
                                weight: 'bold'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = Math.round((value / total) * 100);
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createOwnershipChart() {
        const canvas = document.getElementById('ownershipChart');
        if (!canvas || !this.app.currentStats?.byOwnership) return;

        // Destroy existing chart if it exists
        if (this.charts.ownership) {
            this.charts.ownership.destroy();
        }

        const ctx = canvas.getContext('2d');
        const data = this.app.currentStats.byOwnership;

        const labels = Object.keys(data);
        const values = Object.values(data);

        this.charts.ownership = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverOffset: 20,
                    hoverBackgroundColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(59, 130, 246, 1)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = Math.round((value / total) * 100);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} facilities (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createStaffChart() {
        const canvas = document.getElementById('staffChart');
        if (!canvas || !this.app.facilities) return;

        // Destroy existing chart if it exists
        if (this.charts.staff) {
            this.charts.staff.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Aggregate staff data from facilities
        let totalDoctors = 0;
        let totalNurses = 0;
        let totalOthers = 0;

        this.app.facilities.forEach(facility => {
            if (facility.staff) {
                totalDoctors += facility.staff.doctors || 0;
                totalNurses += facility.staff.nurses || 0;
                totalOthers += facility.staff.others || 0;
            }
        });

        const data = {
            labels: ['Doctors', 'Nurses', 'Other Staff'],
            datasets: [{
                data: [totalDoctors, totalNurses, totalOthers],
                backgroundColor: [this.chartColors[0], this.chartColors[1], this.chartColors[2]],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        this.charts.staff = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.datasets[0].data,
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(251, 146, 60, 0.8)'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverOffset: 20,
                    hoverBackgroundColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(251, 146, 60, 1)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);

                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = Math.round((value / total) * 100);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} staff (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createLGAChart() {
        const canvas = document.getElementById('lgaChart');
        if (!canvas || !this.app.currentStats?.byLGA) return;

        // Destroy existing chart if it exists
        if (this.charts.lga) {
            this.charts.lga.destroy();
        }

        const ctx = canvas.getContext('2d');
        const data = this.app.currentStats.byLGA;

        // Sort LGAs by facility count and take top 10
        const sortedLGAs = Object.entries(data)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedLGAs.map(([lga]) => lga);
        const values = sortedLGAs.map(([, count]) => count);

        // Create gradient colors for bars
        const barColors = values.map((_, index) => {
            const intensity = 0.9 - (index * 0.06);
            return `rgba(249, 115, 22, ${intensity})`;
        });

        this.charts.lga = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Facilities',
                    data: values,
                    backgroundColor: barColors,
                    borderColor: barColors.map(color => color.replace(/[\d.]+\)$/g, '1)')),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: barColors.map(color => color.replace(/[\d.]+\)$/g, '1)'))
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.x} facilities`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Number of Facilities',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'LGAs',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                size: 10,
                                weight: 'bold'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }


    createEmergencyChart() {
        const canvas = document.getElementById('emergencyChart');
        if (!canvas || !this.app.currentStats) return;

        if (this.charts.emergency) {
            this.charts.emergency.destroy();
        }

        const ctx = canvas.getContext('2d');
        const withEmergency = this.app.currentStats.emergencyServices || 0;
        const withoutEmergency = this.app.currentStats.total - withEmergency;

        this.charts.emergency = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['With Emergency Services', 'Without Emergency Services'],
                datasets: [{
                    data: [withEmergency, withoutEmergency],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(156, 163, 175, 0.3)'
                    ],
                    borderColor: ['#ef4444', '#9ca3af'],
                    borderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 11, weight: 'bold' },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = Math.round((value / total) * 100);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} facilities (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createTwentyFourSevenChart() {
        const canvas = document.getElementById('twentyFourSevenChart');
        if (!canvas || !this.app.currentStats) return;

        if (this.charts.twentyFourSeven) {
            this.charts.twentyFourSeven.destroy();
        }

        const ctx = canvas.getContext('2d');
        const twentyFourSeven = this.app.currentStats.twentyFourSeven || 0;
        const notTwentyFourSeven = this.app.currentStats.total - twentyFourSeven;

        this.charts.twentyFourSeven = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['24/7 Operations', 'Limited Hours'],
                datasets: [{
                    data: [twentyFourSeven, notTwentyFourSeven],
                    backgroundColor: [
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(156, 163, 175, 0.3)'
                    ],
                    borderColor: ['#06b6d4', '#9ca3af'],
                    borderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 11, weight: 'bold' },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = Math.round((value / total) * 100);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed} facilities (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    createCapacityChart() {
        const canvas = document.getElementById('capacityChart');
        if (!canvas || !this.app.facilities) return;

        if (this.charts.capacity) {
            this.charts.capacity.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Calculate average capacity by facility type
        const capacityByType = {};
        this.app.facilities.forEach(facility => {
            if (!capacityByType[facility.type]) {
                capacityByType[facility.type] = { total: 0, count: 0 };
            }
            capacityByType[facility.type].total += facility.capacity?.dailyCapacity || 0;
            capacityByType[facility.type].count += 1;
        });

        const labels = Object.keys(capacityByType);
        const avgCapacities = labels.map(type =>
            Math.round(capacityByType[type].total / capacityByType[type].count)
        );

        const gradientColors = [
            { start: 'rgba(139, 92, 246, 0.8)', end: 'rgba(139, 92, 246, 0.4)' },
            { start: 'rgba(168, 85, 247, 0.8)', end: 'rgba(168, 85, 247, 0.4)' },
            { start: 'rgba(192, 132, 252, 0.8)', end: 'rgba(192, 132, 252, 0.4)' }
        ];

        this.charts.capacity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Daily Capacity',
                    data: avgCapacities,
                    backgroundColor: gradientColors.map(color => color.start),
                    borderColor: gradientColors.map(color => color.start.replace('0.8', '1')),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: gradientColors.map(color => color.start.replace('0.8', '1'))
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => `${context.parsed.y} patients/day`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutBounce'
                }
            }
        });
    }

    createRatingsChart() {
        const canvas = document.getElementById('ratingsChart');
        if (!canvas || !this.app.facilities) return;

        if (this.charts.ratings) {
            this.charts.ratings.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Group facilities by rating
        const ratingGroups = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        this.app.facilities.forEach(facility => {
            const rating = Math.floor(facility.rating || 0);
            if (rating >= 1 && rating <= 5) {
                ratingGroups[rating.toString()]++;
            }
        });

        const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
        const values = [ratingGroups['1'], ratingGroups['2'], ratingGroups['3'], ratingGroups['4'], ratingGroups['5']];

        this.charts.ratings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Facilities',
                    data: values,
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(251, 146, 60, 0.7)',
                        'rgba(250, 204, 21, 0.7)',
                        'rgba(163, 230, 53, 0.7)',
                        'rgba(34, 197, 94, 0.7)'
                    ],
                    borderColor: [
                        '#ef4444',
                        '#fb923c',
                        '#facc15',
                        '#a3e635',
                        '#22c55e'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverOffset: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => `${context.parsed.y} facilities`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 11 },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11, weight: 'bold' }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutElastic'
                }
            }
        });
    }


    // Method to update charts when filters change
    updateCharts(filteredFacilities) {
        if (!filteredFacilities) return;

        // Recalculate stats for filtered data
        const filteredStats = this.calculateFilteredStats(filteredFacilities);

        // Update each chart with new data
        this.updateFacilityTypeChart(filteredStats.byType);
        this.updateOwnershipChart(filteredStats.byOwnership);
        this.updateStaffChart(filteredFacilities);
        this.updateLGAChart(filteredStats.byLGA);

        // Update new charts
        if (this.charts.emergency) {
            const withEmergency = filteredFacilities.filter(f => f.services?.emergency).length;
            const withoutEmergency = filteredFacilities.length - withEmergency;
            this.charts.emergency.data.datasets[0].data = [withEmergency, withoutEmergency];
            this.charts.emergency.update();
        }

        if (this.charts.twentyFourSeven) {
            const twentyFourSeven = filteredFacilities.filter(f => f.operatingHours?.twentyFourSeven).length;
            const notTwentyFourSeven = filteredFacilities.length - twentyFourSeven;
            this.charts.twentyFourSeven.data.datasets[0].data = [twentyFourSeven, notTwentyFourSeven];
            this.charts.twentyFourSeven.update();
        }

        // Recreate capacity and ratings charts with new data
        this.app.facilities = filteredFacilities;
        this.createCapacityChart();
        this.createRatingsChart();
    }

    calculateFilteredStats(facilities) {
        const stats = {
            byType: {},
            byOwnership: {},
            byLGA: {}
        };

        facilities.forEach(facility => {
            // By type
            stats.byType[facility.type] = (stats.byType[facility.type] || 0) + 1;
            
            // By ownership
            stats.byOwnership[facility.ownership] = (stats.byOwnership[facility.ownership] || 0) + 1;
            
            // By LGA
            stats.byLGA[facility.lga] = (stats.byLGA[facility.lga] || 0) + 1;
        });

        return stats;
    }

    updateFacilityTypeChart(data) {
        if (this.charts.facilityType && data) {
            this.charts.facilityType.data.datasets[0].data = Object.values(data);
            this.charts.facilityType.update();
        }
    }

    updateOwnershipChart(data) {
        if (this.charts.ownership && data) {
            this.charts.ownership.data.datasets[0].data = Object.values(data);
            this.charts.ownership.update();
        }
    }

    updateStaffChart(facilities) {
        if (this.charts.staff && facilities) {
            let totalDoctors = 0;
            let totalNurses = 0;
            let totalOthers = 0;

            facilities.forEach(facility => {
                if (facility.staff) {
                    totalDoctors += facility.staff.doctors || 0;
                    totalNurses += facility.staff.nurses || 0;
                    totalOthers += facility.staff.others || 0;
                }
            });

            this.charts.staff.data.datasets[0].data = [totalDoctors, totalNurses, totalOthers];
            this.charts.staff.update();
        }
    }

    updateLGAChart(data) {
        if (this.charts.lga && data) {
            // Sort and take top 10
            const sortedLGAs = Object.entries(data)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            this.charts.lga.data.labels = sortedLGAs.map(([lga]) => lga);
            this.charts.lga.data.datasets[0].data = sortedLGAs.map(([, count]) => count);
            this.charts.lga.update();
        }
    }

    // Utility method to destroy all charts
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Make ChartsHandler globally available
window.ChartsHandler = ChartsHandler;
