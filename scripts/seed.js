
const fs = require('fs');
const path = require('path');

// Rivers State geographic bounds
const RIVERS_STATE_BOUNDS = {
    minLng: 6.35,
    maxLng: 7.65,
    minLat: 4.30,
    maxLat: 5.80
};

// LGAs in Rivers State
const LGAS = [
    'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni',
    'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche',
    'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni',
    'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo',
    'Port Harcourt', 'Tai'
];

// Facility types with target distribution
const FACILITY_TYPES = [
    { type: 'Primary Health Center', count: 180, color: '#22c55e', ownership: ['Public', 'Private'] },
    { type: 'General Hospital', count: 85, color: '#3b82f6', ownership: ['Public', 'Private'] },
    { type: 'Private Clinic', count: 60, color: '#f59e0b', ownership: ['Private'] },
    { type: 'Specialist Hospital', count: 18, color: '#e11d48', ownership: ['Public', 'Private'] },
    { type: 'Teaching Hospital', count: 5, color: '#8b5cf6', ownership: ['Public'] },
    { type: 'Diagnostic Center', count: 5, color: '#06b6d4', ownership: ['Private'] }
];

// Sample facility names by type
const FACILITY_NAMES = {
    'Primary Health Center': [
        'Community Health Center', 'Primary Care Clinic', 'Health Post', 'Basic Health Unit',
        'Ward Health Center', 'Rural Health Clinic', 'Primary Health Facility', 'Community Clinic'
    ],
    'General Hospital': [
        'General Hospital', 'District Hospital', 'Regional Hospital', 'Medical Center',
        'Hospital', 'Healthcare Complex', 'Medical Facility'
    ],
    'Private Clinic': [
        'Medical Clinic', 'Healthcare Clinic', 'Family Clinic', 'Medical Practice',
        'Health Clinic', 'Private Medical Center', 'Wellness Center'
    ],
    'Specialist Hospital': [
        'Specialist Hospital', 'Medical Specialist Center', 'Specialist Medical Facility',
        'Advanced Medical Center', 'Tertiary Hospital', 'Referral Hospital'
    ],
    'Teaching Hospital': [
        'University Teaching Hospital', 'Teaching Hospital', 'Medical College Hospital',
        'Academic Medical Center', 'Training Hospital'
    ],
    'Diagnostic Center': [
        'Diagnostic Center', 'Medical Diagnostics', 'Imaging Center', 'Lab & Diagnostic Services',
        'Medical Testing Center', 'Diagnostic Services'
    ]
};

// Generate random coordinate within Rivers State bounds
function generateRandomCoordinate() {
    const lng = RIVERS_STATE_BOUNDS.minLng + Math.random() * (RIVERS_STATE_BOUNDS.maxLng - RIVERS_STATE_BOUNDS.minLng);
    const lat = RIVERS_STATE_BOUNDS.minLat + Math.random() * (RIVERS_STATE_BOUNDS.maxLat - RIVERS_STATE_BOUNDS.minLat);
    return [lng, lat];
}

// Generate random phone number
function generatePhoneNumber() {
    const prefixes = ['070', '080', '081', '090', '091'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 90000000) + 10000000;
    return `+234${prefix.substring(1)}${suffix}`;
}

// Generate random email
function generateEmail(facilityName, lga) {
    const domain = Math.random() > 0.5 ? 'gmail.com' : 'yahoo.com';
    const cleanName = facilityName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLga = lga.toLowerCase().replace(/[^a-z]/g, '');
    return `${cleanName.substring(0, 8)}@${cleanLga}.${domain}`;
}

// Generate random address
function generateAddress(lga) {
    const streetNumbers = Math.floor(Math.random() * 200) + 1;
    const streetNames = [
        'Aba Road', 'Port Harcourt Road', 'East-West Road', 'Trans-Amadi Road',
        'Ikwerre Road', 'Stadium Road', 'Aggrey Road', 'Forces Avenue',
        'GRA Phase', 'Old Aba Road', 'Circular Road', 'Creek Road',
        'Yakubu Gowon Street', 'Liberation Stadium Road', 'Rumuola Road'
    ];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    return `${streetNumbers} ${streetName}, ${lga}, Rivers State`;
}

// Generate operating hours
function generateOperatingHours() {
    const is24_7 = Math.random() < 0.15; // 15% chance of 24/7 operation
    
    if (is24_7) {
        return {
            twentyFourSeven: true,
            weekdays: '24 hours',
            weekends: '24 hours'
        };
    }
    
    const openHour = Math.floor(Math.random() * 3) + 6; // 6-8 AM
    const closeHour = Math.floor(Math.random() * 4) + 18; // 6-9 PM
    
    return {
        twentyFourSeven: false,
        weekdays: `${openHour}:00 - ${closeHour}:00`,
        weekends: Math.random() > 0.3 ? `${openHour + 1}:00 - ${closeHour - 1}:00` : 'Closed'
    };
}

// Generate services
function generateServices(facilityType) {
    const baseServices = ['General Consultation', 'Health Check-up'];
    const emergencyService = Math.random() < 0.4; // 40% chance of emergency services
    
    let services = [...baseServices];
    
    switch (facilityType) {
        case 'Primary Health Center':
            services.push('Immunization', 'Maternal Care', 'Child Health');
            if (Math.random() < 0.3) services.push('Laboratory Services');
            break;
        case 'General Hospital':
            services.push('Laboratory Services', 'X-Ray', 'Pharmacy', 'Surgery', 'Maternity');
            if (emergencyService) services.push('Emergency Services');
            break;
        case 'Private Clinic':
            services.push('Laboratory Services', 'Pharmacy');
            if (Math.random() < 0.6) services.push('Specialist Consultation');
            break;
        case 'Specialist Hospital':
            services.push('Specialist Consultation', 'Surgery', 'Laboratory Services', 'Radiology');
            if (emergencyService) services.push('Emergency Services');
            break;
        case 'Teaching Hospital':
            services.push('All Medical Services', 'Emergency Services', 'Surgery', 'ICU', 'Laboratory Services', 'Radiology', 'Pharmacy');
            break;
        case 'Diagnostic Center':
            services.push('Laboratory Services', 'X-Ray', 'Ultrasound', 'CT Scan');
            if (Math.random() < 0.3) services.push('MRI');
            break;
    }
    
    return {
        available: services,
        emergency: emergencyService
    };
}

// Generate staff information
function generateStaff(facilityType, capacity) {
    let doctors, nurses, others;
    
    switch (facilityType) {
        case 'Teaching Hospital':
            doctors = Math.floor(Math.random() * 50) + 30;
            nurses = Math.floor(Math.random() * 100) + 60;
            others = Math.floor(Math.random() * 40) + 20;
            break;
        case 'Specialist Hospital':
            doctors = Math.floor(Math.random() * 20) + 10;
            nurses = Math.floor(Math.random() * 30) + 15;
            others = Math.floor(Math.random() * 15) + 8;
            break;
        case 'General Hospital':
            doctors = Math.floor(Math.random() * 15) + 5;
            nurses = Math.floor(Math.random() * 25) + 10;
            others = Math.floor(Math.random() * 12) + 5;
            break;
        case 'Private Clinic':
            doctors = Math.floor(Math.random() * 5) + 2;
            nurses = Math.floor(Math.random() * 8) + 3;
            others = Math.floor(Math.random() * 5) + 2;
            break;
        case 'Primary Health Center':
            doctors = Math.floor(Math.random() * 3) + 1;
            nurses = Math.floor(Math.random() * 6) + 2;
            others = Math.floor(Math.random() * 4) + 1;
            break;
        case 'Diagnostic Center':
            doctors = Math.floor(Math.random() * 4) + 2;
            nurses = Math.floor(Math.random() * 6) + 2;
            others = Math.floor(Math.random() * 8) + 3;
            break;
        default:
            doctors = Math.floor(Math.random() * 5) + 2;
            nurses = Math.floor(Math.random() * 8) + 3;
            others = Math.floor(Math.random() * 5) + 2;
    }
    
    return {
        doctors,
        nurses,
        others,
        total: doctors + nurses + others
    };
}

// Generate capacity information
function generateCapacity(facilityType) {
    let beds, capacity;
    
    switch (facilityType) {
        case 'Teaching Hospital':
            beds = Math.floor(Math.random() * 300) + 200;
            capacity = Math.floor(beds * 1.2);
            break;
        case 'Specialist Hospital':
            beds = Math.floor(Math.random() * 100) + 50;
            capacity = Math.floor(beds * 1.1);
            break;
        case 'General Hospital':
            beds = Math.floor(Math.random() * 80) + 30;
            capacity = Math.floor(beds * 1.1);
            break;
        case 'Private Clinic':
            beds = Math.floor(Math.random() * 20) + 5;
            capacity = Math.floor(beds * 1.5);
            break;
        case 'Primary Health Center':
            beds = Math.floor(Math.random() * 10) + 2;
            capacity = Math.floor(beds * 2);
            break;
        case 'Diagnostic Center':
            beds = Math.floor(Math.random() * 5) + 1;
            capacity = Math.floor(beds * 3);
            break;
        default:
            beds = Math.floor(Math.random() * 20) + 5;
            capacity = Math.floor(beds * 1.5);
    }
    
    return {
        beds,
        dailyCapacity: capacity,
        score: Math.min(Math.max(Math.floor((beds / 10) * 10), 8), 60) // 8-60 for 3D height
    };
}

// Generate analytics data
function generateAnalytics() {
    const monthlyData = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 11; i >= 0; i--) {
        const month = (currentMonth - i + 12) % 12;
        const monthName = new Date(2024, month).toLocaleDateString('en-US', { month: 'short' });
        monthlyData.push({
            month: monthName,
            patients: Math.floor(Math.random() * 800) + 200,
            emergencies: Math.floor(Math.random() * 50) + 10
        });
    }
    
    return {
        monthlyPatients: monthlyData,
        averageWaitTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
        patientSatisfaction: Math.round((Math.random() * 2 + 3) * 10) / 10 // 3.0-5.0
    };
}

// Main function to generate all facilities
function generateFacilities() {
    const facilities = [];
    let facilityId = 1;
    
    console.log('Generating Rivers State medical facilities...');
    
    FACILITY_TYPES.forEach(facilityTypeInfo => {
        console.log(`Generating ${facilityTypeInfo.count} ${facilityTypeInfo.type} facilities...`);
        
        for (let i = 0; i < facilityTypeInfo.count; i++) {
            const coordinate = generateRandomCoordinate();
            const lga = LGAS[Math.floor(Math.random() * LGAS.length)];
            const ownership = facilityTypeInfo.ownership[Math.floor(Math.random() * facilityTypeInfo.ownership.length)];
            const facilityNameBase = FACILITY_NAMES[facilityTypeInfo.type][Math.floor(Math.random() * FACILITY_NAMES[facilityTypeInfo.type].length)];
            const facilityName = `${lga} ${facilityNameBase} ${i + 1}`;
            
            const capacity = generateCapacity(facilityTypeInfo.type);
            const staff = generateStaff(facilityTypeInfo.type, capacity);
            const services = generateServices(facilityTypeInfo.type);
            const operatingHours = generateOperatingHours();
            const analytics = generateAnalytics();
            
            const facility = {
                id: facilityId++,
                name: facilityName,
                type: facilityTypeInfo.type,
                ownership: ownership,
                location: {
                    coordinates: coordinate,
                    address: generateAddress(lga),
                    lga: lga,
                    state: 'Rivers State'
                },
                contact: {
                    phone: generatePhoneNumber(),
                    email: generateEmail(facilityName, lga),
                    website: Math.random() > 0.7 ? `https://www.${facilityName.toLowerCase().replace(/\s+/g, '')}.com` : null
                },
                operatingHours: operatingHours,
                services: services,
                staff: staff,
                capacity: capacity,
                rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
                lastUpdated: new Date().toISOString(),
                analytics: analytics,
                // Additional properties for mapping
                lga: lga, // For easy filtering
                // 3D visualization properties
                color: facilityTypeInfo.color,
                height: capacity.score // For 3D extrusion (8-60 meters)
            };
            
            facilities.push(facility);
        }
    });
    
    console.log(`Generated ${facilities.length} facilities total`);
    return facilities;
}

// Main execution
async function main() {
    try {
        console.log('Starting Rivers State Medical Facilities data generation...');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Generate facilities data
        const facilities = generateFacilities();
        
        // Write to JSON file
        const outputPath = path.join(dataDir, 'facilities.json');
        fs.writeFileSync(outputPath, JSON.stringify(facilities, null, 2));
        
        console.log(`Successfully generated ${facilities.length} medical facilities`);
        console.log(`Data saved to: ${outputPath}`);
        
        // Print summary statistics
        const summary = FACILITY_TYPES.map(type => ({
            type: type.type,
            count: facilities.filter(f => f.type === type.type).length,
            color: type.color
        }));
        
        console.log('\nFacility Distribution:');
        summary.forEach(s => console.log(`  ${s.type}: ${s.count} facilities`));
        
        console.log('\nData generation completed successfully!');
        
    } catch (error) {
        console.error('Error generating facilities data:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { generateFacilities, FACILITY_TYPES, LGAS };
