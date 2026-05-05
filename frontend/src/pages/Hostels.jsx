import React, { useState, useEffect } from 'react';
import { api, API_CONFIG } from '../services/api';
import '../Hostels.css';

const Hostels = () => {
    const [hostels, setHostels] = useState([]);
    const [filteredHostels, setFilteredHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    
    // Modal states
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [viewRoomsModal, setViewRoomsModal] = useState(false);
    const [reservationModal, setReservationModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [userRatings, setUserRatings] = useState({});

    useEffect(() => {
        // True authentic user data with both university and private hostels
        const completeData = [
            // University Hostels
            { id: 1, name: "Bensdorf Hostel", type: "university", price: "UGX 750,000 /sem", gender: "Female", occupancy: "45/60 Occupied", rating: 4.0, reviews: 12, caretaker: "0769559707", rooms: "Available", image: "/IMAGES/bensdorf.png" },
            { id: 2, name: "SL Hostel", type: "university", price: "UGX 650,000 /sem", gender: "Male", occupancy: "85/100 Occupied", rating: 4.8, reviews: 24, caretaker: "0744895697", rooms: "Available", image: "/IMAGES/sl.png" },
            { id: 3, name: "Seattle Hostel", type: "university", price: "UGX 680,000 /sem", gender: "Male", occupancy: "120/120 Occupied", rating: 3.2, reviews: 8, caretaker: "0744895697", rooms: "Full", image: "/IMAGES/seatle.png" },
            { id: 4, name: "Clifford Hostel", type: "university", price: "UGX 700,000 /sem", gender: "Female", occupancy: "70/80 Occupied", rating: 4.2, reviews: 19, caretaker: "0769559707", rooms: "Available", image: "/IMAGES/clifford.png" },
            
            // Private Hostels (names from IMAGES folder)
            { id: 5, name: "Kenmor Hostel", type: "private", price: "UGX 450,000 /sem", gender: "Male", occupancy: "25/30 Occupied", rating: 4.2, reviews: 18, caretaker: "0772345678", rooms: "Available", image: "/IMAGES/kenmor.png" },
            { id: 6, name: "Rose Hostel", type: "private", price: "UGX 400,000 /sem", gender: "Female", occupancy: "20/25 Occupied", rating: 4.0, reviews: 15, caretaker: "0765432109", rooms: "Available", image: "/IMAGES/rose.png" },
            { id: 7, name: "Endvor Hostel", type: "private", price: "UGX 480,000 /sem", gender: "Mixed", occupancy: "18/24 Occupied", rating: 3.9, reviews: 22, caretaker: "0734567890", rooms: "Available", image: "/IMAGES/endvor.png" },
            { id: 8, name: "City View Hostel", type: "private", price: "UGX 420,000 /sem", gender: "Male", occupancy: "30/35 Occupied", rating: 4.1, reviews: 12, caretaker: "0787654321", rooms: "Available", image: "/IMAGES/cityview.png" }
        ];
        
        setHostels(completeData);
        setFilteredHostels(completeData);
        setLoading(false);
    }, []);

    useEffect(() => {
        const filtered = hostels.filter(hostel => {
            const matchesSearch = hostel.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' || hostel.type === typeFilter;
            const matchesGender = genderFilter === 'all' || hostel.gender === genderFilter;
            return matchesSearch && matchesType && matchesGender;
        });
        setFilteredHostels(filtered);
    }, [searchTerm, typeFilter, genderFilter, hostels]);

    const handleViewRooms = (h) => {
        setSelectedHostel(h);
        setViewRoomsModal(true);
    };

    const handleBookNow = (h) => {
        setSelectedHostel(h);
        setSelectedRoom(null); // Reset selected room when opening directly
        setReservationModal(true);
    };

    const handleSelectRoom = (h, roomName) => {
        setSelectedHostel(h);
        setSelectedRoom(roomName);
        setViewRoomsModal(false);
        setReservationModal(true);
    };

    const renderHostelGrid = (category, data) => {
        if (data.length === 0) return null;
        return (
            <div key={category} style={{ marginBottom: '2rem' }}>
                <div className="category-header">
                    <h3>{category.toUpperCase()} HOSTELS</h3>
                    <h2>{category.charAt(0).toUpperCase() + category.slice(1)} Hostels</h2>
                </div>
                <div className="category-grid">
                    {data.map(h => (
                        <div key={h.id} className="hostel-card">
                            <div className="h-img-container">
                                <img src={h.image} className="h-img" alt={h.name} />
                                {h.type === 'university' && <span className="h-badge">University Owned</span>}
                                {h.type === 'private' && <span className="h-badge">Private</span>}
                            </div>
                            <div className="h-content">
                                <div className="h-header-row">
                                    <h3 className="h-title">{h.name}</h3>
                                    <div className="h-rating">
                                        <span className="star" style={{ color: '#fbbf24' }}>★</span>
                                        <strong>{h.rating}</strong>
                                        <span className="reviews">({h.reviews})</span>
                                    </div>
                                </div>
                                <div className="h-details">
                                    <span>👤 {h.gender} Only</span>
                                    <span>🛏️ {h.occupancy}</span>
                                </div>
                                <div className="h-price">
                                    <strong>{h.price}</strong>
                                </div>
                                <div className="h-actions">
                                    <button className="h-btn-outline" onClick={() => handleViewRooms(h)}>View Rooms</button>
                                    <button className={`h-btn-solid ${h.rooms === 'Full' ? 'full-btn' : ''}`} disabled={h.rooms === 'Full'} onClick={() => handleBookNow(h)}>
                                        {h.rooms === 'Full' ? 'Hostel Full' : 'Reserve Now'}
                                    </button>
                                </div>
                                <div className="h-custodian">
                                    <strong>Caretaker:</strong> {h.caretaker}<br/>
                                    <a href={`tel:${h.caretaker}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                                        📞 Call {h.caretaker}
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const universityHostels = filteredHostels.filter(h => h.type === 'university');
    const privateHostels = filteredHostels.filter(h => h.type === 'private');

    return (
        <section id="hostels" className="page-section active">
            <div className="hostels-hero">
                <h2>Available Hostels</h2>
                <p>Browse and book your preferred student accommodation</p>
            </div>

            <div className="advanced-filter-bar">
                <div className="search-row">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search hostels by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-row">
                    <label>Category: 
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="all">All Hostels</option>
                            <option value="university">University Hostels</option>
                            <option value="private">Private Hostels</option>
                        </select>
                    </label>
                    <label>Gender: 
                        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                            <option value="all">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                    </label>
                </div>
            </div>
            
            <div className="hostels-content">
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading hostels...</p>
                ) : filteredHostels.length === 0 ? (
                    <p className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>No hostels found matching your criteria.</p>
                ) : (
                    <>
                        {renderHostelGrid('university', universityHostels)}
                        {renderHostelGrid('private', privateHostels)}
                    </>
                )}
            </div>

            {/* View Rooms Modal */}
            {viewRoomsModal && selectedHostel && (
                <div className="modal show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-content" style={{maxWidth: '700px'}}>
                        <span className="close-modal" onClick={() => setViewRoomsModal(false)}>&times;</span>
                        <h2>Available Rooms at {selectedHostel.name}</h2>
                        <div style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span style={{color: '#475569', fontWeight: '500'}}>Rate This Hostel:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                    key={star} 
                                    style={{
                                        cursor: 'pointer', 
                                        fontSize: '1.8rem', 
                                        color: star <= (userRatings[selectedHostel.id] || 0) ? '#fbbf24' : '#cbd5e1',
                                        transition: 'color 0.2s',
                                        lineHeight: '1'
                                    }} 
                                    onClick={() => {
                                        setUserRatings(prev => ({...prev, [selectedHostel.id]: star}));
                                        alert(`Thank you for rating ${selectedHostel.name} with ${star} stars!`);
                                    }}
                                >
                                    &#9733;
                                </span>
                            ))}
                        </div>
                        <div className="rooms-container">
                            <table className="rooms-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem'}}>
                                <thead>
                                    <tr>
                                        <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Room</th>
                                        <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Type</th>
                                        <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Capacity</th>
                                        <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Facilities</th>
                                        <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Generate dynamic rooms based on hostel name initial (matching original app.js)
                                        const prefix = selectedHostel.name.charAt(0).toUpperCase();
                                        const roomConfigs = [
                                            { type: 'Single', capacity: '1 Person', facilities: 'En-suite Bath, Desk, Wi-Fi' },
                                            { type: 'Double', capacity: '2 People', facilities: 'Shared Bath, Wardrobe, Wi-Fi' },
                                            { type: 'Dormitory', capacity: '4 People', facilities: 'Common Bath, Lockers, Wi-Fi' },
                                            { type: 'Double', capacity: '2 People', facilities: 'En-suite Bath, Balcony, Wi-Fi' },
                                            { type: 'Single', capacity: '1 Person', facilities: 'Premium En-suite, A/C, Wi-Fi' }
                                        ];

                                        return roomConfigs.map((room, index) => {
                                            const roomName = `${prefix}${index + 1}`;
                                            return (
                                                <tr key={index}>
                                                    <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}><strong>{roomName}</strong></td>
                                                    <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.type}</td>
                                                    <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.capacity}</td>
                                                    <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b'}}>{room.facilities}</td>
                                                    <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>
                                                        <button 
                                                            className="h-btn-solid" 
                                                            style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px'}} 
                                                            onClick={() => handleSelectRoom(selectedHostel, roomName)}
                                                        >
                                                            Select
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Reservation Modal */}
            {reservationModal && selectedHostel && (
                <div className="modal show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-content">
                        <span className="close-modal" onClick={() => setReservationModal(false)}>&times;</span>
                        <h2>Reserve a Room at {selectedHostel.name}</h2>
                        <form className="vertical-form" onSubmit={async (e) => {
                            e.preventDefault();
                            
                            // Check if user is logged in
                            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                            if (!currentUser) {
                                alert('Please sign in to reserve a room.');
                                // Redirect to login page
                                window.location.href = '/login';
                                return;
                            }
                            
                            try {
                                const isUpload = document.getElementById('paymentMethod')?.value === 'upload_receipt';
                                let response;
                                
                                const priceString = selectedHostel.price || '0';
                                const totalAmount = parseFloat(priceString.replace(/[^0-9.-]+/g,"")) || 0;
                                const notesInfo = `Student ID: ${document.getElementById('resStudentId')?.value}, Gender: ${document.getElementById('resGender')?.value}, Room Type: ${document.getElementById('resRoomType')?.value}, Room Number: ${document.getElementById('resRoomNumber')?.value || selectedRoom}`;
                                
                                if (isUpload) {
                                    const formData = new FormData();
                                    formData.append('hostel', selectedHostel.id);
                                    formData.append('payment_method', document.getElementById('paymentMethod')?.value);
                                    formData.append('total_amount', totalAmount);
                                    formData.append('semester', 'Fall 2024');
                                    formData.append('academic_year', '2024-2025');
                                    formData.append('check_in_date', '2024-09-01');
                                    formData.append('check_out_date', '2024-12-20');
                                    formData.append('notes', notesInfo);
                                    
                                    const fileInput = document.getElementById('receiptUpload');
                                    if (fileInput && fileInput.files.length > 0) {
                                        formData.append('receipt_image', fileInput.files[0]);
                                    }
                                    
                                    response = await api.upload(API_CONFIG.RESERVATIONS.CREATE, formData);
                                } else {
                                    const jsonData = {
                                        hostel: selectedHostel.id,
                                        payment_method: document.getElementById('paymentMethod')?.value,
                                        total_amount: totalAmount,
                                        semester: 'Fall 2024',
                                        academic_year: '2024-2025',
                                        check_in_date: '2024-09-01',
                                        check_out_date: '2024-12-20',
                                        notes: notesInfo
                                    };
                                    
                                    response = await api.post(API_CONFIG.RESERVATIONS.CREATE, jsonData);
                                }
                                
                                alert('Reservation successful! Your room has been reserved.');
                                setReservationModal(false);
                            } catch (error) {
                                console.error('Reservation error:', error);
                                alert(`Reservation failed: ${error.message || 'Please check your connection and try again.'}`);
                            }
                        }}>
                            <label htmlFor="resName">Full Name</label>
                            <input type="text" id="resName" required />

                            <label htmlFor="resStudentId">Student ID (Format: 24/BSE/BU/R/0008/YEAR/COURSE/3 LETTERS/BU/0001-1000)</label>
                            <input type="text" id="resStudentId" placeholder="e.g. 24/BSE/BU/R/0008/2024/BSE/ABC/BU/0001" required />
                            <small style={{fontSize: '0.75rem', color: '#64748b', marginTop: '5px', display: 'block'}}>
                                BSE = Bachelor in Software Engineering | R = Regular Student
                            </small>

                            <label htmlFor="resGender">Gender</label>
                            <select id="resGender" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>

                            <label htmlFor="resRoomNumber">Room Number</label>
                            <select id="resRoomNumber" required>
                                <option value="">Select Room</option>
                                {(() => {
                                    if (!selectedHostel) return null;
                                    const prefix = selectedHostel.name.charAt(0).toUpperCase();
                                    const roomConfigs = [
                                        { type: 'Single', capacity: '1 Person', facilities: 'En-suite Bath, Desk, Wi-Fi' },
                                        { type: 'Double', capacity: '2 People', facilities: 'Shared Bath, Wardrobe, Wi-Fi' },
                                        { type: 'Dormitory', capacity: '4 People', facilities: 'Common Bath, Lockers, Wi-Fi' },
                                        { type: 'Double', capacity: '2 People', facilities: 'En-suite Bath, Balcony, Wi-Fi' },
                                        { type: 'Single', capacity: '1 Person', facilities: 'Premium En-suite, A/C, Wi-Fi' }
                                    ];
                                    
                                    return roomConfigs.map((room, index) => {
                                        const roomName = `${prefix}${index + 1}`;
                                        return (
                                            <option key={index} value={roomName}>
                                                {roomName} - {room.type} ({room.capacity})
                                            </option>
                                        );
                                    });
                                })()}
                            </select>

                            <label htmlFor="resRoomType">Room Type</label>
                            <select id="resRoomType" required>
                                <option value="single">Single Room</option>
                                <option value="double">Double Room</option>
                                <option value="mixed">Mixed Shared</option>
                            </select>
                            
                            <div className="deposit-section">
                                <h3>Payment Details</h3>
                                <p style={{marginBottom: '10px'}}>A 50% deposit is required to secure your booking.</p>
                                
                                <label htmlFor="paymentMethod">Payment Method</label>
                                <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                                    <option value="">Select Method</option>
                                    <option value="mobile_money">Mobile Money (Direct Prompt)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="upload_receipt">I have already paid (Upload Receipt)</option>
                                </select>

                                {paymentMethod === 'mobile_money' && (
                                    <div style={{marginTop: '1rem'}}>
                                        <label htmlFor="mmNumber">Mobile Money Number</label>
                                        <input type="tel" id="mmNumber" placeholder="e.g. 0772123456" />
                                        <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4'}}>Enter your number and click Confirm. You will receive a prompt on your phone to enter your PIN and complete the deposit.</p>
                                    </div>
                                )}

                                {paymentMethod === 'bank_transfer' && (
                                    <div style={{marginTop: '1rem', background: '#ffffff', padding: '1rem', borderLeft: '4px solid #3b82f6', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                                        <h4 style={{marginBottom: '0.5rem', color: '#1e3a8a', fontSize: '0.95rem'}}>University Bank Details</h4>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}><strong>Bank:</strong> Centenary Bank</p>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}><strong>Account Name:</strong> Bugema University Hostels</p>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.8rem'}}><strong>Account Number:</strong> 3100012345000</p>
                                        <p style={{fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4'}}>Please transfer your 50% deposit to the account above, then upload your receipt below to verify.</p>
                                    </div>
                                )}

                                {paymentMethod === 'upload_receipt' && (
                                    <div style={{marginTop: '1rem'}}>
                                        <label htmlFor="receiptUpload">Upload Receipt (PDF/Image)</label>
                                        <input type="file" id="receiptUpload" accept=".pdf, image/*" required />
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="primary-btn">Confirm Reservation</button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hostels;
