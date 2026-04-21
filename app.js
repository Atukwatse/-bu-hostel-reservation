const hostels = [
    { id: 1, name: "Bensdorf Hostel", type: "university", price: "UGX 750,000 /sem", gender: "Female", occupancy: "45/60 Occupied", rating: 4.0, reviews: 12, custodian: "0769559707", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=BH" },
    { id: 2, name: "SL Hostel", type: "university", price: "UGX 650,000 /sem", gender: "Male", occupancy: "85/100 Occupied", rating: 4.8, reviews: 24, custodian: "0744895697", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=SL" },
    { id: 3, name: "Seattle Hostel", type: "university", price: "UGX 680,000 /sem", gender: "Male", occupancy: "120/120 Occupied", rating: 3.2, reviews: 8, custodian: "0744895697", rooms: "Full", image: "https://placehold.co/400x200/3b82f6/ffffff?text=SE" },
    { id: 4, name: "Clifford Hostel", type: "university", price: "UGX 700,000 /sem", gender: "Female", occupancy: "70/80 Occupied", rating: 4.2, reviews: 19, custodian: "0769559707", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=CH" },
    { id: 5, name: "Cityview Hostel", type: "private", price: "UGX 720,000 /sem", gender: "Male", occupancy: "75/90 Occupied", rating: 4.1, reviews: 16, custodian: "0772345678", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=CV" },
    { id: 6, name: "Rose Hostel", type: "private", price: "UGX 580,000 /sem", gender: "Female", occupancy: "60/75 Occupied", rating: 4.7, reviews: 31, custodian: "0798765432", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=RH" },
    { id: 7, name: "Endeavor Hostel", type: "private", price: "UGX 750,000 /sem", gender: "Mixed", occupancy: "70/85 Occupied", rating: 4.3, reviews: 22, custodian: "0765432109", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=EH" },
    { id: 8, name: "Kernmol Hostel", type: "private", price: "UGX 680,000 /sem", gender: "Male", occupancy: "65/80 Occupied", rating: 3.5, reviews: 9, custodian: "0734567890", rooms: "Available", image: "https://placehold.co/400x200/3b82f6/ffffff?text=KH" }
];

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    displayHostels(hostels);
    
    // Form submissions prevention
    document.getElementById('reservationForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const method = document.getElementById('paymentMethod').value;
        
        if (method === 'mobile_money') {
            const num = document.getElementById('mmNumber').value;
            alert(`A payment prompt has been sent to ${num}. Please check your phone to confirm the reservation!\n\n(Note: This is a demo. In a real app, you would enter your PIN now.)`);
        } else {
            alert("Reservation Request and Payment Receipt Uploaded Successfully! We will review your payment shortly.");
        }
        
        closeModal();
        e.target.reset();
        togglePaymentFields(); // Hide fields again after reset
    });

    document.getElementById('inquiryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('inqType').value;
        if (type === 'feedback') {
            alert("Thank you for rating our system and providing feedback!");
        } else {
            alert("Inquiry Sent Successfully!");
        }
        e.target.reset();
        if(typeof toggleRatingField === 'function') toggleRatingField(); // Hide rating field again if shown
        showSection('home');
    });

    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userName = document.getElementById('loginName').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;
            
            if (role === 'admin') {
                if (userName.toLowerCase() === 'admin' && password === 'admin123') {
                    alert(`Welcome Administrator! You have successfully logged into the system.`);
                    // You can redirect to an admin dashboard here in the future
                    e.target.reset();
                    showSection('home');
                } else {
                    alert(`Invalid Admin credentials! (Hint: use admin / admin123)`);
                }
            } else {
                alert(`Welcome back, ${userName}! Logged in successfully as a Student.`);
                e.target.reset();
                showSection('home');
            }
        });
    }

    const createAccountForm = document.getElementById('createAccountForm');
    if(createAccountForm) {
        createAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirmPassword').value;
            if(pass !== confirm) {
                alert('Passwords do not match!');
                return;
            }
            alert("Account Created Successfully! Please login.");
            e.target.reset();
            showSection('login');
        });
    }
});

// Navigation Logic
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // If specific hostel section, we show hostels page but filtered
    if (sectionId === 'university-hostels') {
        document.getElementById('hostels').classList.add('active');
        document.getElementById('typeFilter').value = 'university';
        document.getElementById('searchInput').value = '';
        filterHostels();
    } else if (sectionId === 'private-hostels') {
        document.getElementById('hostels').classList.add('active');
        document.getElementById('typeFilter').value = 'private';
        document.getElementById('searchInput').value = '';
        filterHostels();
    } else if (sectionId === 'hostels') {
        document.getElementById('hostels').classList.add('active');
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('genderFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        filterHostels();
    } else if (sectionId === 'home') {
        document.getElementById('home').classList.add('active');
    } else {
        // Show inquiry or rate us
        const target = document.getElementById(sectionId);
        if(target) target.classList.add('active');
    }
}

// Render Hostels
function displayHostels(data) {
    const container = document.getElementById('hostels-list');
    container.innerHTML = ''; // Clear current

    if (data.length === 0) {
        container.innerHTML = '<p class="no-results">No hostels found matching your criteria.</p>';
        return;
    }

    const universityHostels = data.filter(h => h.type === 'university');
    const privateHostels = data.filter(h => h.type === 'private');

    if (universityHostels.length > 0) {
        container.innerHTML += `
            <div class="category-header">
                <h3>UNIVERSITY HOSTELS</h3>
                <h2>University Hostels</h2>
            </div>
            <div class="category-grid" id="grid-university"></div>
        `;
        renderGridItems('grid-university', universityHostels);
    }

    if (privateHostels.length > 0) {
        container.innerHTML += `
            <div class="category-header">
                <h3>PRIVATE HOSTELS</h3>
                <h2>Private Hostels</h2>
            </div>
            <div class="category-grid" id="grid-private"></div>
        `;
        renderGridItems('grid-private', privateHostels);
    }
}

function renderGridItems(containerId, items) {
    const gridContainer = document.getElementById(containerId);
    items.forEach(hostel => {
        const card = document.createElement('div');
        card.className = 'hostel-card';
        card.innerHTML = `
            <div class="h-image">
                <img src="${hostel.image}" alt="${hostel.name}">
            </div>
            <div class="h-content">
                <span class="h-badge ${hostel.rooms === 'Full' ? 'full' : 'available'}">${hostel.rooms}</span>
                <h3 class="h-name">${hostel.name}</h3>
                <p class="h-occupancy">${hostel.gender} | ${hostel.occupancy}</p>
                <div class="h-rating">
                    <span class="stars">★★★★${hostel.rating >= 4.5 ? '★' : '☆'}</span> 
                    <span class="score">${hostel.rating}</span> 
                    <span class="reviews">(${hostel.reviews} reviews)</span>
                </div>
                <p class="h-price"><strong>${hostel.price}</strong></p>
                <div class="h-custodian">
                    📞 Custodian: <strong>${hostel.custodian}</strong>
                </div>
                <div class="h-actions">
                    <button class="h-btn-outline" onclick="openRoomsModal(${hostel.id}, '${hostel.name}')">View Rooms</button>
                    <button class="h-btn-solid" onclick="openReservationModal(${hostel.id}, '${hostel.name}')" ${hostel.rooms === 'Full' ? 'disabled' : ''}>
                        ${hostel.rooms === 'Full' ? 'Full' : 'Reserve Now'}
                    </button>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// Filter and Search Logic
function filterHostels() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.getElementById('typeFilter').value;
    const filterGender = document.getElementById('genderFilter').value;

    const filtered = hostels.filter(hostel => {
        const matchesSearch = hostel.name.toLowerCase().includes(searchTerm);
        const matchesType = filterType === 'all' || hostel.type === filterType;
        const matchesGender = filterGender === 'all' || hostel.gender === filterGender;
        return matchesSearch && matchesType && matchesGender;
    });

    displayHostels(filtered);
}

// Modal Logic
function openReservationModal(hostelId, hostelName) {
    document.getElementById('selectedHostelId').value = hostelId;
    document.getElementById('modalHostelName').innerText = `Reserve a Room at ${hostelName}`;
    document.getElementById('reservationModal').classList.add('show');
}

function closeModal() {
    document.getElementById('reservationModal').classList.remove('show');
}

function openRoomsModal(hostelId, hostelName) {
    document.getElementById('roomsModalHostelName').innerText = `Available Rooms at ${hostelName}`;
    const container = document.getElementById('roomsContainer');
    
    // Generate dynamic rooms based on hostel name initial
    const prefix = hostelName.charAt(0).toUpperCase();
    
    const roomConfigs = [
        { type: 'Single', capacity: '1 Person', facilities: 'En-suite Bath, Desk, Wi-Fi' },
        { type: 'Double', capacity: '2 People', facilities: 'Shared Bath, Wardrobe, Wi-Fi' },
        { type: 'Dormitory', capacity: '4 People', facilities: 'Common Bath, Lockers, Wi-Fi' },
        { type: 'Double', capacity: '2 People', facilities: 'En-suite Bath, Balcony, Wi-Fi' },
        { type: 'Single', capacity: '1 Person', facilities: 'Premium En-suite, A/C, Wi-Fi' }
    ];

    let rowsHTML = '';
    for(let i=0; i<5; i++) {
        const roomName = `${prefix}${i+1}`;
        const room = roomConfigs[i];
        rowsHTML += `
            <tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;"><strong>${roomName}</strong></td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">${room.type}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">${room.capacity}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b;">${room.facilities}</td>
                <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
                    <button class="h-btn-solid" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px;" onclick="openReservationModal(${hostelId}, '${hostelName}'); closeRoomsModal();">Select</button>
                </td>
            </tr>
        `;
    }

    container.innerHTML = `
        <table class="rooms-table" style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 1rem;">
            <thead>
                <tr>
                    <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Room</th>
                    <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Type</th>
                    <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Capacity</th>
                    <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Facilities</th>
                    <th style="padding: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
    document.getElementById('viewRoomsModal').classList.add('show');
}

function closeRoomsModal() {
    document.getElementById('viewRoomsModal').classList.remove('show');
}

// Inquiry/Rating Toggle
function toggleRatingField() {
    const type = document.getElementById('inqType').value;
    const ratingSection = document.getElementById('ratingSection');
    const ratingInput = document.getElementById('inqRating');
    if(ratingSection && ratingInput) {
        if (type === 'feedback') {
            ratingSection.style.display = 'block';
            ratingInput.setAttribute('required', 'true');
        } else {
            ratingSection.style.display = 'none';
            ratingInput.removeAttribute('required');
        }
    }
}

// Payment Toggle Logic
function togglePaymentFields() {
    const method = document.getElementById('paymentMethod');
    if (!method) return;
    
    const methodValue = method.value;
    const mmDetails = document.getElementById('mobileMoneyDetails');
    const bankDetails = document.getElementById('bankDetails');
    const receiptSection = document.getElementById('receiptSection');
    const mmNumber = document.getElementById('mmNumber');
    const receiptUpload = document.getElementById('receiptUpload');

    // Hide all first
    if(mmDetails) mmDetails.style.display = 'none';
    if(bankDetails) bankDetails.style.display = 'none';
    if(receiptSection) receiptSection.style.display = 'none';

    // Remove required attributes
    if(mmNumber) mmNumber.removeAttribute('required');
    if(receiptUpload) receiptUpload.removeAttribute('required');

    if (methodValue === 'mobile_money') {
        if(mmDetails) mmDetails.style.display = 'block';
        if(mmNumber) mmNumber.setAttribute('required', 'true');
    } else if (methodValue === 'bank_transfer') {
        if(bankDetails) bankDetails.style.display = 'block';
        if(receiptSection) receiptSection.style.display = 'block';
        if(receiptUpload) receiptUpload.setAttribute('required', 'true');
    } else if (methodValue === 'upload_receipt') {
        if(receiptSection) receiptSection.style.display = 'block';
        if(receiptUpload) receiptUpload.setAttribute('required', 'true');
    }
}

// Login Tab Switcher
function switchLoginTab(role) {
    document.getElementById('loginRole').value = role;
    
    const tabStudent = document.getElementById('tab-student');
    const tabAdmin = document.getElementById('tab-admin');
    const lblName = document.getElementById('lblLoginName');
    const inputName = document.getElementById('loginName');
    
    if (role === 'student') {
        tabStudent.classList.add('active');
        tabAdmin.classList.remove('active');
        lblName.innerText = 'Phone Number';
        inputName.placeholder = 'e.g. 0712345678';
    } else {
        tabAdmin.classList.add('active');
        tabStudent.classList.remove('active');
        lblName.innerText = 'Admin Username';
        inputName.placeholder = 'e.g. admin';
    }
}

// Close modal if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('reservationModal');
    if (event.target == modal) {
        closeModal();
    }
    const modalRooms = document.getElementById('viewRoomsModal');
    if (event.target == modalRooms) {
        closeRoomsModal();
    }
}
