
// Rivers MedMap Application Logic
class RiversMedMap {
    constructor() {
        this.facilities = [];
        this.filteredFacilities = [];
        this.currentStats = null;
        this.searchTimeout = null;
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            
            // Load initial data
            await this.loadFacilities();
            await this.loadStats();
            
            // Initialize UI components
            this.initEventListeners();
            this.initFilters();
            this.populateFilterOptions();
            this.updateStatsDisplay();
            
            // Handle deep linking
            this.handleDeepLinks();
            
            // Initialize map and charts
            if (window.MapHandler) {
                window.mapHandler = new MapHandler(this);
            }
            
            if (window.ChartsHandler) {
                window.chartsHandler = new ChartsHandler(this);
            }
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to load application data');
            this.showLoading(false);
        }
    }

    async loadFacilities(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/facilities?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch facilities');
            }
            
            const facilities = await response.json();
            this.facilities = facilities;
            this.filteredFacilities = facilities;
            
            // Update facility count display
            const facilityCount = document.getElementById('facilityCount');
            if (facilityCount) {
                facilityCount.textContent = `${facilities.length} facilities`;
            }
            
            return facilities;
        } catch (error) {
            console.error('Error loading facilities:', error);
            throw error;
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats/summary');
            
            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }
            
            this.currentStats = await response.json();
            return this.currentStats;
        } catch (error) {
            console.error('Error loading statistics:', error);
            throw error;
        }
    }

    async searchFacilities(query) {
        try {
            if (!query || query.length < 2) {
                return [];
            }
            
            const response = await fetch(`/api/facilities/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Search request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error searching facilities:', error);
            return [];
        }
    }

    initEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            // Close search results when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.add('hidden');
                }
            });
        }

        // Filter event listeners
        const filters = [
            'typeFilter', 'ownershipFilter', 'lgaFilter', 
            'ratingFilter', 'emergencyFilter', 'twentyFourFilter'
        ];
        
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Navigation buttons
        const navButtons = document.querySelectorAll('[onclick^="showSection"]');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.getAttribute('onclick').match(/showSection\('(\w+)'\)/)?.[1];
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Legend toggle
        const showLegendBtn = document.getElementById('showLegend');
        const mapLegend = document.getElementById('mapLegend');
        
        if (showLegendBtn && mapLegend) {
            showLegendBtn.addEventListener('click', () => {
                const isHidden = mapLegend.classList.contains('hidden');
                if (isHidden) {
                    mapLegend.classList.remove('hidden');
                    showLegendBtn.textContent = 'Hide Legend';
                } else {
                    mapLegend.classList.add('hidden');
                    showLegendBtn.textContent = 'Show Legend';
                }
            });
        }

        // Share functionality
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareCurrentFacility());
        }
    }

    async handleSearch(query) {
        const searchResults = document.getElementById('searchResults');
        
        if (!searchResults) return;
        
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await this.searchFacilities(query);
                this.displaySearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                searchResults.classList.add('hidden');
            }
        }, 300);
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        const html = results.map(facility => {
            let starRating = '';

            for (let i = 0; i < Math.floor(facility.rating); i++) {
                starRating += '⭐';
            }
            // Add a half star if the decimal part is 0.5 or greater
            if (facility.rating % 1 !== 0) {
                starRating += '🌟';
            }

            return `
                <div class="search-result-item" onclick="app.selectFacility(${facility.id})">
                    <div class="search-result-name">${facility.name}</div>
                    <div class="search-result-details">
                        ${facility.type} | ${facility.lga} | ⭐(${facility.rating})
                    </div>
                </div>
                <hr>
            `;
        }).join('');
        
        searchResults.innerHTML = html;
        searchResults.classList.remove('hidden');
    }

    async selectFacility(facilityId) {
        try {
            // Hide search results
            const searchResults = document.getElementById('searchResults');
            if (searchResults) {
                searchResults.classList.add('hidden');
            }
            
            // Get facility details
            const response = await fetch(`/api/facilities/${facilityId}`);
            if (!response.ok) {
                throw new Error('Facility not found');
            }
            
            const facility = await response.json();
            
            // Show facility details modal
            this.showFacilityDetails(facility);
            
            // Center map on facility if map handler exists
            if (window.mapHandler) {
                window.mapHandler.flyToFacility(facility);
            }
            
            // Update URL for deep linking
            this.updateURL(facilityId);
            
        } catch (error) {
            console.error('Error selecting facility:', error);
            this.showError('Failed to load facility details');
        }
    }

    showFacilityDetails(facility) {
        const modal = document.getElementById('facilityModal');
        const modalTitle = document.getElementById('facilityModalTitle');
        const modalBody = document.getElementById('facilityModalBody');
        
        if (modalTitle) {
            modalTitle.textContent = facility.name;
        }
        
        if (modalBody && facility) {
            modalBody.innerHTML = this.generateFacilityDetailsHTML(facility);
        }
        
        // Store current facility for sharing
        this.currentFacility = facility;
        
        // Show modal using modern approach
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        // Initialize icons in modal content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    generateFacilityDetailsHTML(facility) {
        const services = facility.services?.available || [];
        const staff = facility.staff || {};
        const capacity = facility.capacity || {};
        const contact = facility.contact || {};
        const location = facility.location || {};
        

        
        let star = "⭐";
        for (let i = 1; i < facility.rating; i++) {
            star += "⭐";
        }

        return `
            <div class="facility-detail-section">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <i data-lucide="info" class="w-4 h-4 text-white"></i>
                        </div>
                        <h4 class="text-lg font-jakarta font-bold text-gray-900">Basic Information</h4>
                    </div>
                    <table class="w-full table-auto border-collapse">
                        <tbody class="text-gray-700">
                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">Type:</td>
                                <td class="py-2 px-4">${facility.type}</td>
                            </tr>

                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">Ownership</td>
                                <td class="py-2 px-4">${facility.ownership}</td>
                            </tr>


                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">LGA:</td>
                                <td class="py-2 px-4">${facility.lga || location.lga}</td>
                            </tr>

                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">Rating:</td>
                                <td class="py-2 px-4">${star}</td>
                            </tr>

                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">Phone:</td>
                                <td class="py-2 px-4">
                            <a href="tel:contact.phone" class="text−medical−600hover:text−medical−700transition−colors"> ${contact.phone || 'N/A'}</a>
                            </td>
                            </tr>
                            <tr class="border-b border-gray-200">
                                <td class="py-2 px-4 font-semibold bg-gray-50">Email:</td>
                                <td class="py-2 px-4">
                            <a href="mailto:contact.email"class="text−medical−600hover:text−medical−700transition−colors"> ${contact.email || 'N/A'}</a>
                            </td>
                            </tr>
                            <tr>
                                <td class="py-2 px-4 font-semibold bg-gray-50">Address:</td>
                                <td class="py-2 px-4">${location.address || 'Address not available'}</td>
                            </tr>
                        </tbody>
                    </table>
            </div>


            <br><br>
            <div class="facility-detail-section">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i data-lucide="users" class="w-4 h-4 text-white"></i>
                    </div>
                    <h4 class="text-lg font-jakarta font-bold text-gray-900">Capacity & Staff</h4>
                </div>

                <table class="w-full table-auto border-collapse">
                    <tbody class="text-gray-700">
                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Beds</td>
                            <td class="py-2 px-4">${facility.beds || 'N/A'}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Daily Capacity</td>
                            <td class="py-2 px-4">${capacity.dailyCapacity || 'N/A'}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Doctors</td>
                            <td class="py-2 px-4">${staff.doctors || 0}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Nurses</td>
                            <td class="py-2 px-4">${staff.nurses || 0}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Others</td>
                            <td class="py-2 px-4">${staff.others || 0}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Total Staff</td>
                            <td class="py-2 px-4">${staff.total || 0}</td>
                        </tr>
                    </tbody>
                </table>

            <br><br>

            <div class="facility-detail-section">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <i data-lucide="clock" class="w-4 h-4 text-white"></i>
                    </div>
                    <h4 class="text-lg font-jakarta font-bold text-gray-900">Operating Hours</h4>
                </div>


                <table class="w-full table-auto border-collapse">
                    <tbody class="text-gray-700">
                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Weekdays</td>
                            <td class="py-2 px-4">${facility.operatingHours?.weekdays || 'N/A'}</td>
                        </tr>

                        <tr class="border-b border-gray-200">
                            <td class="py-2 px-4 font-semibold bg-gray-50">Weekends</td>
                            <td class="py-2 px-4">${facility.operatingHours?.weekends || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>

                <br><br>

                ${facility.operatingHours?.twentyFourSeven ? '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center space-x-2 mb-2"><i data-lucide="clock" class="w-4 h-4"></i><span class="font-medium">24/7 Operation Available</span></div>' : ''}
                
                ${facility.services?.emergency ? '<div style="margin-top:10px;" class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center space-x-2"><i data-lucide="zap" class="w-4 h-4"></i><span class="font-medium">Emergency Services Available</span></div>' : ''}
            </div>


            <br><br>

            <div class="facility-detail-section">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <i data-lucide="activity" class="w-4 h-4 text-white"></i>
                    </div>
                    <h4 class="text-lg font-jakarta font-bold text-gray-900">Services Available</h4>
                </div>
                <table class="w-full table-auto border-collapse">
                    <tbody class="text-gray-700">
                        ${services.length > 0 ? services.map(service => 
                            `
                            <tr class="border-b border-gray-200">
                                <td class="service-badge">${service}</td>
                            <tr>`).join('') : '<p class="text-gray-500 italic">No services information available</p>'
                        }


                    <tbody>
                </table>
            </div>
        `;
    }

    async applyFilters() {
        const filters = this.getActiveFilters();
        
        try {
            // Show loading state
            this.showLoading(true);
            
            // Load filtered facilities
            const facilities = await this.loadFacilities(filters);
            
            // Update map if available
            if (window.mapHandler) {
                window.mapHandler.updateFacilities(facilities);
            }
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError('Failed to apply filters');
            this.showLoading(false);
        }
    }

    getActiveFilters() {
        const filters = {};
        
        const typeFilter = document.getElementById('typeFilter')?.value;
        if (typeFilter && typeFilter !== 'all') {
            filters.type = typeFilter;
        }
        
        const ownershipFilter = document.getElementById('ownershipFilter')?.value;
        if (ownershipFilter && ownershipFilter !== 'all') {
            filters.ownership = ownershipFilter;
        }
        
        const lgaFilter = document.getElementById('lgaFilter')?.value;
        if (lgaFilter && lgaFilter !== 'all') {
            filters.lga = lgaFilter;
        }
        
        const ratingFilter = document.getElementById('ratingFilter')?.value;
        if (ratingFilter) {
            filters.minRating = ratingFilter;
        }
        
        const emergencyFilter = document.getElementById('emergencyFilter')?.checked;
        if (emergencyFilter) {
            filters.emergency = 'true';
        }
        
        const twentyFourFilter = document.getElementById('twentyFourFilter')?.checked;
        if (twentyFourFilter) {
            filters.twentyfour = 'true';
        }
        
        return filters;
    }

    clearFilters() {
        // Reset all filter controls
        const selects = ['typeFilter', 'ownershipFilter', 'lgaFilter', 'ratingFilter'];
        selects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = element.options[0]?.value || '';
            }
        });
        
        const checkboxes = ['emergencyFilter', 'twentyFourFilter'];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = false;
            }
        });
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Hide search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.classList.add('hidden');
        }
        
        // Apply empty filters (reload all facilities)
        this.applyFilters();
    }

    populateFilterOptions() {
        // Populate LGA filter
        const lgaFilter = document.getElementById('lgaFilter');
        if (lgaFilter && this.currentStats?.byLGA) {
            const lgas = Object.keys(this.currentStats.byLGA).sort();
            lgas.forEach(lga => {
                const option = document.createElement('option');
                option.value = lga;
                option.textContent = `${lga} (${this.currentStats.byLGA[lga]})`;
                lgaFilter.appendChild(option);
            });
        }
    }

    updateStatsDisplay() {
        if (!this.currentStats) return;
        
        // Update sidebar stats
        const updates = [
            { id: 'totalFacilities', value: this.currentStats.total },
            { id: 'emergencyCount', value: this.currentStats.emergencyServices },
            { id: 'twentyFourCount', value: this.currentStats.twentyFourSeven },
            { id: 'avgRating', value: this.currentStats.averageRating }
        ];
        
        updates.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update analytics cards
        const analyticsUpdates = [
            { id: 'totalFacilitiesCard', value: this.currentStats.total },
            { id: 'totalStaffCard', value: this.currentStats.totalStaff },
            { id: 'totalBedsCard', value: this.currentStats.totalCapacity },
            { id: 'avgRatingCard', value: this.currentStats.averageRating }
        ];
        
        analyticsUpdates.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update about section stats
        const publicCount = this.currentStats.byOwnership?.Public || 0;
        const privateCount = this.currentStats.byOwnership?.Private || 0;
        
        const aboutUpdates = [
            { id: 'publicCount', value: publicCount },
            { id: 'privateCount', value: privateCount },
            { id: 'emergencyCountAbout', value: this.currentStats.emergencyServices }
        ];
        
        aboutUpdates.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = ['mapSection', 'analyticsSection', 'aboutSection'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.classList.add('hidden');
            }
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update navigation active state using the global function
        if (typeof updateNavigation === 'function') {
            updateNavigation(sectionName);
        }
        
        // Initialize charts if showing analytics section
        if (sectionName === 'analytics' && window.chartsHandler) {
            setTimeout(() => {
                window.chartsHandler.initializeCharts();
            }, 100);
        }
        
        // Initialize icons for the new section
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    shareCurrentFacility() {
        if (!this.currentFacility) return;
        
        if (navigator.share) {
            navigator.share({
                title: this.currentFacility.name,
                text: `Check out ${this.currentFacility.name} - ${this.currentFacility.type} in ${this.currentFacility.lga}`,
                url: `${window.location.origin}#fac=${this.currentFacility.id}`
            });
        } else {
            // Fallback - copy to clipboard
            const url = `${window.location.origin}#fac=${this.currentFacility.id}`;
            navigator.clipboard.writeText(url).then(() => {
                alert('Facility link copied to clipboard!');
            });
        }
    }

    handleDeepLinks() {
        const hash = window.location.hash;
        if (hash.startsWith('#fac=')) {
            const facilityId = parseInt(hash.substring(5));
            if (facilityId) {
                setTimeout(() => {
                    this.selectFacility(facilityId);
                }, 1000); // Wait for initialization
            }
        }
    }

    updateURL(facilityId) {
        const newHash = `#fac=${facilityId}`;
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.remove('hidden');
            } else {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    showError(message) {
        console.error('Application error:', message);
        // You could implement a proper error display here
        alert(`Error: ${message}`);
    }

    initFilters() {
        // This method can be extended for more complex filter initialization
        console.log('Filters initialized');
    }
}

// Global function for section navigation (called from HTML)
function showSection(sectionName) {
    if (window.app) {
        window.app.showSection(sectionName);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RiversMedMap();
});
