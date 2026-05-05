// API Integration Test File
// This file can be used to test the frontend-backend connection

async function testAPIConnection() {
    console.log('Testing API Connection...');
    
    try {
        // Test 1: Check if API is accessible
        console.log('1. Testing API base URL...');
        const response = await fetch('http://localhost:8000/api/hostels/hostels/');
        if (response.ok) {
            console.log('✅ API is accessible');
        } else {
            console.log('❌ API not accessible:', response.status);
            return false;
        }
        
        // Test 2: Test login endpoint
        console.log('2. Testing login endpoint...');
        const loginData = {
            phone: '700000000',
            password: 'admin123',
            role: 'admin',
            country_code: '+256'
        };
        
        const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            console.log('✅ Login endpoint working');
            console.log('Token:', loginResult.token);
            console.log('User:', loginResult.user);
        } else {
            console.log('❌ Login endpoint failed:', await loginResponse.text());
        }
        
        // Test 3: Test hostels endpoint
        console.log('3. Testing hostels endpoint...');
        const hostelsResponse = await fetch('http://localhost:8000/api/hostels/hostels/');
        if (hostelsResponse.ok) {
            const hostels = await hostelsResponse.json();
            console.log('✅ Hostels endpoint working');
            console.log('Found', hostels.length, 'hostels');
            if (hostels.length > 0) {
                console.log('Sample hostel:', hostels[0].name);
            }
        } else {
            console.log('❌ Hostels endpoint failed:', await hostelsResponse.text());
        }
        
        console.log('✅ API Integration Test Complete');
        return true;
        
    } catch (error) {
        console.error('❌ API Integration Test Failed:', error);
        console.log('\nTroubleshooting tips:');
        console.log('1. Make sure Django backend is running on http://localhost:8000');
        console.log('2. Run "python manage.py seed_data" to populate test data');
        console.log('3. Check CORS settings in Django settings.py');
        console.log('4. Verify API endpoints are correctly configured');
        return false;
    }
}

// Function to test frontend API client
async function testFrontendAPIClient() {
    console.log('Testing Frontend API Client...');
    
    try {
        // Test API client initialization
        if (typeof api !== 'undefined') {
            console.log('✅ API client initialized');
            
            // Test API call
            const hostels = await api.get('/hostels/hostels/');
            console.log('✅ API client working');
            console.log('Found', hostels.length, 'hostels via API client');
            
            return true;
        } else {
            console.log('❌ API client not initialized');
            console.log('Make sure api-config.js is loaded before app.js');
            return false;
        }
    } catch (error) {
        console.error('❌ Frontend API Client Test Failed:', error);
        return false;
    }
}

// Auto-run tests when page loads
window.addEventListener('load', () => {
    // Only run tests if we're on localhost (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🧪 Running API Integration Tests...');
        
        // Wait a bit for everything to load
        setTimeout(async () => {
            const apiTest = await testAPIConnection();
            const clientTest = await testFrontendAPIClient();
            
            if (apiTest && clientTest) {
                console.log('🎉 All tests passed! Frontend-Backend integration is working.');
            } else {
                console.log('⚠️ Some tests failed. Please check the backend setup.');
            }
        }, 1000);
    }
});

// Export functions for manual testing
if (typeof window !== 'undefined') {
    window.testAPIConnection = testAPIConnection;
    window.testFrontendAPIClient = testFrontendAPIClient;
}
