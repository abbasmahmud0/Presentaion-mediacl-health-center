
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load facilities data
let facilitiesData = [];

function loadFacilitiesData() {
    try {
        const dataPath = path.join(__dirname, 'data', 'facilitiesNew.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        facilitiesData = JSON.parse(data);
        console.log(`Loaded ${facilitiesData.length} medical facilities`);
    } catch (error) {
        console.error('Error loading facilities data:', error.message);
        facilitiesData = [];
    }
}

// Load data on startup
loadFacilitiesData();

// API Routes

// Get all facilities
app.get('/api/facilities', (req, res) => {
    try {
        const { type, ownership, lga, emergency, twentyfour, minRating } = req.query;
        
        let filteredFacilities = [...facilitiesData];
        
        if (type && type !== 'all') {
            filteredFacilities = filteredFacilities.filter(f => f.type === type);
        }
        
        if (ownership && ownership !== 'all') {
            filteredFacilities = filteredFacilities.filter(f => f.ownership === ownership);
        }
        
        if (lga && lga !== 'all') {
            filteredFacilities = filteredFacilities.filter(f => f.lga === lga);
        }
        
        if (emergency === 'true') {
            filteredFacilities = filteredFacilities.filter(f => f.services?.emergency === true);
        }
        
        if (twentyfour === 'true') {
            filteredFacilities = filteredFacilities.filter(f => f.operatingHours?.twentyFourSeven === true);
        }
        
        if (minRating) {
            filteredFacilities = filteredFacilities.filter(f => f.rating >= parseFloat(minRating));
        }
        
        res.json(filteredFacilities);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search facilities
app.get('/api/facilities/search', (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }
        
        const searchTerm = q.toLowerCase();
        const results = facilitiesData.filter(facility => 
            facility.name?.toLowerCase().includes(searchTerm) ||
            facility.lga?.toLowerCase().includes(searchTerm) ||
            facility.type?.toLowerCase().includes(searchTerm) ||
            facility.address?.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results
        
        res.json(results);
    } catch (error) {
        console.error('Error searching facilities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single facility by ID
app.get('/api/facilities/:id', (req, res) => {
    try {
        const facilityId = parseInt(req.params.id);
        const facility = facilitiesData.find(f => f.id === facilityId);
        
        if (!facility) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        
        res.json(facility);
    } catch (error) {
        console.error('Error fetching facility:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get summary statistics
app.get('/api/stats/summary', (req, res) => {
    try {
        const stats = {
            total: facilitiesData.length,
            byType: {},
            byOwnership: {},
            byLGA: {},
            emergencyServices: 0,
            twentyFourSeven: 0,
            averageRating: 0,
            totalCapacity: 0,
            totalStaff: 0
        };
        
        let totalRating = 0;
        let ratingCount = 0;
        
        facilitiesData.forEach(facility => {
            // By type
            stats.byType[facility.type] = (stats.byType[facility.type] || 0) + 1;
            
            // By ownership
            stats.byOwnership[facility.ownership] = (stats.byOwnership[facility.ownership] || 0) + 1;
            
            // By LGA
            stats.byLGA[facility.lga] = (stats.byLGA[facility.lga] || 0) + 1;
            
            // Emergency services
            if (facility.services?.emergency) {
                stats.emergencyServices++;
            }
            
            // 24/7 services
            if (facility.operatingHours?.twentyFourSeven) {
                stats.twentyFourSeven++;
            }
            
            // Ratings
            if (facility.rating > 0) {
                totalRating += facility.rating;
                ratingCount++;
            }
            
            // Capacity and staff
            if (facility.capacity?.beds) {
                stats.totalCapacity += facility.capacity.beds;
            }
            
            if (facility.staff?.total) {
                stats.totalStaff += facility.staff.total;
            }
        });
        
        stats.averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;
        
        res.json(stats);
    } catch (error) {
        console.error('Error generating stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Rivers MedMap server running on http://localhost:${PORT}`);
});
