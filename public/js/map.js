
// Map functionality for Rivers MedMap
class MapHandler {
    constructor(app) {
        this.app = app;
        this.map = null;
        this.facilities = [];
        this.init();
    }

    init() {
        try {
            this.initMap();
            this.setupMapLegend();
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    initMap() {
    // Initialize MapLibre GL map
    this.map = new maplibregl.Map({
        container: 'map',
        style: {
        version: 8,
        sources: {
            positron: {
            type: 'raster',
            tiles: [
                'https://cartodb-basemaps-a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                'https://cartodb-basemaps-b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                'https://cartodb-basemaps-c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                'https://cartodb-basemaps-d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            }
        },
        layers: [
            {
            id: 'positron-layer',
            source: 'positron',
            type: 'raster'
            }
        ]
        },
        center: [7, 4.8], // Center of Rivers State
        zoom: 9.2,
        pitch: 45, // 3D tilt
        bearing: 0
    });
    


        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
        this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Wait for map to load, then add facilities
        this.map.on('load', () => {
            this.loadFacilitiesOnMap();
        });


        // Inside initMap() after loading facilities
        this.map.on('load', () => {
            this.loadFacilitiesOnMap();
            this.loadBoundaryOnMap("./data/boundary.json"); // add boundary here
        });


    }


    // Add this new method to your class
    async loadBoundaryOnMap(url) {
            try {
                const response = await fetch(url);
                const boundaryData = await response.json();
                if (!boundaryData || !boundaryData.features || boundaryData.features.length === 0) {
                    console.warn('No boundary data available');
                    return;
                }

                // Add boundary source if it doesn't exist
                if (!this.map.getSource('boundary')) {
                    this.map.addSource('boundary', { type: 'geojson', data: boundaryData });

                    // Add the fill layer for the boundary
                    this.map.addLayer({
                        id: 'boundary-fill',
                        type: 'fill',
                        source: 'boundary',
                        paint: {
                            'fill-color': '#dce4c6', // A solid color for the fill
                            'fill-opacity': 0.3 // Adjust transparency as needed (0.0 to 1.0)
                        }
                    });

                    // Add the line layer for the boundary outline
                    this.map.addLayer({
                        id: 'boundary-layer',
                        type: 'line',
                        source: 'boundary',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: { 'line-color': '#636363ff', 'line-width': 2 }
                    });
                } else {
                    // If the source exists, just update the data
                    this.map.getSource('boundary').setData(boundaryData);
                }

            } catch (error) {
                console.error('Error loading boundary:', error);
            }
        }




    async loadFacilitiesOnMap() {
        try {
            // Get facilities data from app
            const facilities = this.app.facilities || [];
            this.facilities = facilities;

            if (facilities.length === 0) {
                console.warn('No facilities data available for map');
                return;
            }

            this.addFacilitiesToMap(facilities);
        } catch (error) {
            console.error('Error loading facilities on map:', error);
        }
    }

    addFacilitiesToMap(facilities) {
        // Create GeoJSON feature collection
        const facilitiesGeoJSON = {
            type: 'FeatureCollection',
            features: facilities.map(facility => ({
                type: 'Feature',
                properties: {
                    id: facility.id,
                    name: facility.name,
                    type: facility.type,
                    ownership: facility.ownership,
                    lga: facility.lga,
                    rating: facility.rating,
                    color: facility.color,
                    height: facility.height,
                    phone: facility.contact?.phone || '',
                    emergency: facility.services?.emergency || false,
                    twentyFourSeven: facility.operatingHours?.twentyFourSeven || false,
                    beds: facility.capacity?.beds || 0
                },
                geometry: {
                    type: 'Point',
                    coordinates: facility.location?.coordinates || [7.0, 5.0]
                }
            }))
        };

        // Add facilities source
        this.map.addSource('facilities', {
            type: 'geojson',
            data: facilitiesGeoJSON
        });

        // Add 3D extruded layer for facilities
        this.map.addLayer({
            id: 'facilities-3d',
            type: 'fill-extrusion',
            source: 'facilities',
            layout: {},
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['*', ['get', 'height'], 1], // Height in meters
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.8
            }
        });

        // Add a circle layer for better visibility at low zoom
        this.map.addLayer({
            id: 'facilities-circles',
            type: 'circle',
            source: 'facilities',
            maxzoom: 20,
            paint: {
                'circle-color': ['get', 'color'],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.8
            }
        });

        // Add labels for facilities
        this.map.addLayer({
            id: 'facilities-labels',
            type: 'symbol',
            source: 'facilities',
            minzoom: -2,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, -2],
                'text-anchor': 'bottom'
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });

        // Add hover and click interactions
        this.setupMapInteractions();
    }

    setupMapInteractions() {
        // Mouse enter/leave for hover effects
        this.map.on('mouseenter', 'facilities-3d', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'facilities-3d', () => {
            this.map.getCanvas().style.cursor = '';
        });

        this.map.on('mouseenter', 'facilities-circles', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'facilities-circles', () => {
            this.map.getCanvas().style.cursor = '';
        });

        // Click handlers for both layers
        this.map.on('click', 'facilities-3d', (e) => {
            this.handleFacilityClick(e);
        });

        this.map.on('click', 'facilities-circles', (e) => {
            this.handleFacilityClick(e);
        });

        // Hover popup for both layers
        this.map.on('mouseenter', 'facilities-3d', (e) => {
            this.showHoverPopup(e);
        });

        this.map.on('mouseenter', 'facilities-circles', (e) => {
            this.showHoverPopup(e);
        });

        this.map.on('mouseleave', 'facilities-3d', () => {
            this.hideHoverPopup();
        });

        this.map.on('mouseleave', 'facilities-circles', () => {
            this.hideHoverPopup();
        });
    }

    handleFacilityClick(e) {
        if (e.features.length > 0) {
            const facility = e.features[0];
            const facilityId = facility.properties.id;
            
            // Use app's selectFacility method
            if (this.app) {
                this.app.selectFacility(facilityId);
            }
        }
    }

    showHoverPopup(e) {
        if (e.features.length > 0) {
            const facility = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            let star = "⭐";
            for (let i = 1; i < facility.rating; i++) {
                star += "⭐";
            }

            const popupContent = `
                <div class="popup-content">
                    <img style="width:100%; height: 150px; border-radius: 25px 25px 0 0;" 
                    src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?_gl=1*1nwis78*_ga*NjczOTAxODIxLjE3NTU4NjQxMTk.*_ga_8JE65Q40S6*czE3NTU4NjQxMTkkbzEkZzEkdDE3NTU4NjQxNDgkajMxJGwwJGgw">
                    <br>
                    <div class="popup-details" style="padding: 25px; font-size: 12px;">
                        <div class="popup-title">${facility.name}</div>
                        <div><strong>Type:</strong> ${facility.type}</div>
                        <div><strong>LGA:</strong> ${facility.lga}</div>
                        <div><strong>Rating:</strong> <span class="popup-rating"> ${star}</span></div><br>
                        ${facility.emergency ? '<div class="text-danger"><strong>🚨 Emergency Services 🚨</strong></div>' : ''}
                        ${facility.twentyFourSeven ? '<div class="text-info"><strong>🕒 24/7 Operation</strong></div>' : ''}
                        <div class="mt-2"><small>Click for more details</small></div>
                    </div>
                </div>
            `;

            // Remove existing popup
            if (this.hoverPopup) {
                this.hoverPopup.remove();
            }

            this.hoverPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: [0, -15]
            })
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(this.map);
        }
    }

    hideHoverPopup() {
        if (this.hoverPopup) {
            this.hoverPopup.remove();
            this.hoverPopup = null;
        }
    }

    updateFacilities(facilities) {
        this.facilities = facilities;
        
        if (!this.map.getSource('facilities')) {
            // If source doesn't exist yet, add facilities normally
            this.addFacilitiesToMap(facilities);
            return;
        }

        // Create new GeoJSON
        const facilitiesGeoJSON = {
            type: 'FeatureCollection',
            features: facilities.map(facility => ({
                type: 'Feature',
                properties: {
                    id: facility.id,
                    name: facility.name,
                    type: facility.type,
                    ownership: facility.ownership,
                    lga: facility.lga,
                    rating: facility.rating,
                    color: facility.color,
                    height: facility.height,
                    phone: facility.contact?.phone || '',
                    emergency: facility.services?.emergency || false,
                    twentyFourSeven: facility.operatingHours?.twentyFourSeven || false,
                    beds: facility.capacity?.beds || 0
                },
                geometry: {
                    type: 'Point',
                    coordinates: facility.location?.coordinates || [7.0, 5.0]
                }
            }))
        };

        // Update the source data
        this.map.getSource('facilities').setData(facilitiesGeoJSON);

        // Update facility count in UI
        const facilityCount = document.getElementById('facilityCount');
        if (facilityCount) {
            facilityCount.textContent = `${facilities.length} facilities`;
        }
    }

    flyToFacility(facility) {
        if (!facility.location?.coordinates) {
            console.warn('No coordinates available for facility:', facility.name);
            return;
        }

        this.map.flyTo({
            center: facility.location.coordinates,
            zoom: 19,
            pitch: 60,
            bearing: 0,
            speed: 1.2,
            curve: 1.42
        });
    }

    setupMapLegend() {
        const legendContent = document.getElementById('legendContent');
        if (!legendContent) return;

        // Define facility types with colors (matching the seed data)
        const facilityTypes = [
            { type: 'Primary Health Center', color: '#22c55e', count: 180 },
            { type: 'General Hospital', color: '#3b82f6', count: 85 },
            { type: 'Private Clinic', color: '#f59e0b', count: 60 },
            { type: 'Specialist Hospital', color: '#e11d48', count: 18 },
            { type: 'Teaching Hospital', color: '#8b5cf6', count: 5 },
            { type: 'Diagnostic Center', color: '#06b6d4', count: 5 }
        ];

        const legendHTML = facilityTypes.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span class="legend-text">${item.type} (${item.count})</span>
            </div>
        `).join('');

        legendContent.innerHTML = legendHTML;
    }

    // Public methods for external use
    zoomToExtent() {
        if (this.facilities.length === 0) return;

        const bounds = new maplibregl.LngLatBounds();
        this.facilities.forEach(facility => {
            if (facility.location?.coordinates) {
                bounds.extend(facility.location.coordinates);
            }
        });

        this.map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 }
        });
    }

    toggleLayer(layerId, visible) {
        const visibility = visible ? 'visible' : 'none';
        this.map.setLayoutProperty(layerId, 'visibility', visibility);
    }

    setMapStyle(styleUrl) {
        this.map.setStyle(styleUrl);
        
        // Re-add facilities after style change
        this.map.once('styledata', () => {
            this.addFacilitiesToMap(this.facilities);
        });
    }
}

// Make MapHandler globally available
window.MapHandler = MapHandler;
