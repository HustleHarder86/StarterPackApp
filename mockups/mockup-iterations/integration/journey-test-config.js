/**
 * Journey Test Configuration
 * Contains test data and scenarios for all three user entry points
 */

const JourneyTestConfig = {
    // Test Users
    users: {
        newUser: {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Test123!',
            type: 'new'
        },
        returningUser: {
            email: 'returning@example.com',
            password: 'Test123!',
            userId: 'test-user-123',
            type: 'returning',
            savedProperties: ['prop-456', 'prop-789']
        },
        testerUser: {
            email: 'tester@starterpackapp.com',
            password: 'Tester123!',
            userId: 'yBilXCUnWAdqUuJfy2YwXnRz4Xy2', // Hardcoded tester ID
            type: 'tester',
            unlimitedSTR: true
        }
    },
    
    // Test Properties
    properties: {
        // Toronto Condo - Good for STR
        torontoCondo: {
            address: '1514 - 150 East Liberty St, Toronto, ON',
            price: 849900,
            bedrooms: 2,
            bathrooms: 2,
            sqft: 1100,
            propertyType: 'Condo',
            propertyTax: 5490,
            condoFees: 554,
            parkingSpaces: 1,
            expectedROI: 11.7,
            expectedCashFlow: 1200,
            strRestrictions: false
        },
        
        // Queen West Property - Premium Location
        queenWest: {
            address: '456 Queen Street West, Toronto, ON',
            price: 1249000,
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1800,
            propertyType: 'Townhouse',
            propertyTax: 8900,
            condoFees: 0,
            parkingSpaces: 2,
            expectedROI: 8.5,
            expectedCashFlow: 890,
            strRestrictions: false
        },
        
        // King West Luxury - High-end
        kingWest: {
            address: '789 King Street West, Toronto, ON',
            price: 1750000,
            bedrooms: 3,
            bathrooms: 3,
            sqft: 2200,
            propertyType: 'Condo',
            propertyTax: 12500,
            condoFees: 980,
            parkingSpaces: 2,
            expectedROI: 6.2,
            expectedCashFlow: -450,
            strRestrictions: true
        },
        
        // Budget Property - Entry Level
        scarborough: {
            address: '123 Progress Ave, Scarborough, ON',
            price: 589000,
            bedrooms: 2,
            bathrooms: 1,
            sqft: 850,
            propertyType: 'Condo',
            propertyTax: 3200,
            condoFees: 420,
            parkingSpaces: 1,
            expectedROI: 14.2,
            expectedCashFlow: 1650,
            strRestrictions: false
        }
    },
    
    // Extension Data Format (from REALTOR.ca)
    extensionData: {
        fullAddress: '456 Queen Street West, Toronto, ON M5V 2A8',
        listPrice: '$1,249,000',
        beds: '3',
        baths: '2',
        livingArea: '1,800 sq ft',
        propertyType: 'Townhouse',
        mlsNumber: 'C5892341',
        listingDate: '2024-01-10',
        propertyTaxes: '$8,900/year',
        maintenanceFees: 'N/A',
        parking: '2 spaces',
        listingAgent: 'Jane Doe',
        brokerage: 'ReMax Central',
        description: 'Beautiful townhouse in the heart of Queen West...',
        images: [
            'https://realtor.ca/image1.jpg',
            'https://realtor.ca/image2.jpg'
        ],
        virtualTour: 'https://realtor.ca/tour/456-queen',
        source: 'extension',
        timestamp: new Date().toISOString()
    },
    
    // API Response Formats
    apiResponses: {
        // Successful analysis response
        successfulAnalysis: {
            success: true,
            analysis: {
                propertyId: 'prop-123',
                analysisId: 'analysis-456',
                timestamp: new Date().toISOString(),
                
                strAnalysis: {
                    monthlyRevenue: 9912,
                    dailyRate: 450,
                    occupancyRate: 73,
                    annualRevenue: 118944,
                    cleaningFees: 150,
                    comparables: [
                        {
                            address: 'Liberty Village Comparable',
                            monthlyRevenue: 9500,
                            occupancy: 75,
                            nightly: 420
                        }
                    ],
                    restrictions: false,
                    seasonality: {
                        high: { months: ['Jun', 'Jul', 'Aug'], rate: 85 },
                        low: { months: ['Jan', 'Feb', 'Mar'], rate: 60 }
                    }
                },
                
                longTermRental: {
                    monthlyRent: 3950,
                    annualIncome: 47400,
                    vacancyRate: 5,
                    comparables: [
                        {
                            address: '839 Queen Street W',
                            monthlyRent: 2600,
                            bedrooms: 2,
                            distance: 0.3
                        }
                    ],
                    marketTrend: 'increasing',
                    averageRentInArea: 3225
                },
                
                costs: {
                    mortgage: {
                        principal: 679920,
                        monthlyPayment: 4211,
                        interestRate: 6.5,
                        term: 25
                    },
                    expenses: {
                        propertyTax: 458,
                        insurance: 125,
                        maintenance: 200,
                        utilities: 180,
                        management: 395,
                        condoFees: 554
                    },
                    totalMonthlyExpenses: 6123
                },
                
                metrics: {
                    cashFlow: 1789,
                    roi: 11.7,
                    capRate: 7.2,
                    breakEvenOccupancy: 62,
                    investmentGrade: 'B+'
                },
                
                recommendation: 'str'
            }
        },
        
        // Error responses
        errors: {
            noAuth: {
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            },
            trialExpired: {
                success: false,
                error: 'STR trial limit reached (5/5 used)',
                code: 'TRIAL_EXPIRED'
            },
            apiTimeout: {
                success: false,
                error: 'Analysis timed out. Please try again.',
                code: 'TIMEOUT'
            },
            invalidData: {
                success: false,
                error: 'Invalid property data',
                code: 'INVALID_DATA'
            }
        }
    },
    
    // Test Scenarios
    scenarios: {
        newUserSuccess: {
            name: 'New User - Successful Full Journey',
            steps: [
                { action: 'signup', data: 'newUser' },
                { action: 'enterProperty', data: 'torontoCondo' },
                { action: 'confirmProperty', expectModal: true },
                { action: 'selectAnalysis', type: 'full' },
                { action: 'viewAnalysis', expectData: true }
            ]
        },
        
        extensionFlow: {
            name: 'Extension User - Direct to Analysis',
            steps: [
                { action: 'receiveExtensionData', data: 'extensionData' },
                { action: 'confirmProperty', expectModal: true },
                { action: 'selectAnalysis', type: 'full' },
                { action: 'viewAnalysis', expectData: true }
            ]
        },
        
        returningUserSaved: {
            name: 'Returning User - Load Saved Property',
            steps: [
                { action: 'login', data: 'returningUser' },
                { action: 'loadSavedProperty', propertyId: 'prop-456' },
                { action: 'viewAnalysis', expectData: true, skipConfirmation: true }
            ]
        },
        
        trialLimitReached: {
            name: 'Free User - Trial Limit Reached',
            steps: [
                { action: 'login', data: 'newUser' },
                { action: 'enterProperty', data: 'queenWest' },
                { action: 'confirmProperty', expectModal: true },
                { action: 'selectAnalysis', type: 'full' },
                { action: 'expectError', error: 'TRIAL_EXPIRED' }
            ]
        },
        
        testerUnlimited: {
            name: 'Tester - Unlimited STR Access',
            steps: [
                { action: 'login', data: 'testerUser' },
                { action: 'enterProperty', data: 'kingWest' },
                { action: 'confirmProperty', expectModal: true },
                { action: 'selectAnalysis', type: 'full' },
                { action: 'viewAnalysis', expectData: true, unlimitedSTR: true }
            ]
        }
    },
    
    // Validation Rules
    validation: {
        requiredFields: {
            property: ['address', 'price'],
            user: ['email', 'password'],
            analysis: ['propertyId', 'analysisType']
        },
        
        dataFormats: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            price: /^\d+$/,
            percentage: /^\d+(\.\d{1,2})?$/,
            currency: /^\$[\d,]+$/
        },
        
        businessRules: {
            minPrice: 100000,
            maxPrice: 10000000,
            minBedrooms: 0,
            maxBedrooms: 10,
            minOccupancy: 30,
            maxOccupancy: 100,
            strTrialLimit: 5
        }
    },
    
    // Mock Delays (to simulate real network conditions)
    delays: {
        apiCall: 2000,
        navigation: 500,
        modalAnimation: 300,
        dataLoad: 1000
    },
    
    // Helper Functions
    helpers: {
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-CA', {
                style: 'currency',
                currency: 'CAD',
                minimumFractionDigits: 0
            }).format(amount);
        },
        
        parseExtensionPrice(priceStr) {
            return parseInt(priceStr.replace(/[$,]/g, ''));
        },
        
        generateMockAnalysis(property) {
            // Generate realistic analysis based on property
            const monthlyRevenue = Math.round(property.price * 0.011);
            const monthlyRent = Math.round(property.price * 0.0032);
            
            return {
                ...this.apiResponses.successfulAnalysis.analysis,
                strAnalysis: {
                    ...this.apiResponses.successfulAnalysis.analysis.strAnalysis,
                    monthlyRevenue
                },
                longTermRental: {
                    ...this.apiResponses.successfulAnalysis.analysis.longTermRental,
                    monthlyRent
                }
            };
        },
        
        simulateNetworkDelay(ms = 1000) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JourneyTestConfig;
}

// Also make available globally
window.JourneyTestConfig = JourneyTestConfig;