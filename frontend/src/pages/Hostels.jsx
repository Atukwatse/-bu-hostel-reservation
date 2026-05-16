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
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    useEffect(() => {
        const fetchHostels = async () => {
            try {
                setLoading(true);
                const response = await api.get(API_CONFIG.HOSTELS.LIST);
                const hostelsData = response.results || response;
                
                // Process hostels data to match expected format
                const processedHostels = hostelsData.map(hostel => ({
                    ...hostel,
                    occupancy: hostel.total_rooms > 0 ? `${hostel.available_rooms}/${hostel.total_rooms}` : hostel.occupancy || 'N/A',
                    rooms: hostel.rooms_status || 'Available',
                    rating: hostel.rating || 0.0,
                    reviews: hostel.reviews || 0,
                    image: hostel.image || '/IMAGES/default-hostel.png'
                }));
                
                setHostels(processedHostels);
                setFilteredHostels(processedHostels);
            } catch (error) {
                console.error('Failed to fetch hostels:', error);
                // Fallback to mock data if API fails
                const fallbackData = [
                    { id: 1, name: "Bensdorf Hostel", type: "university", price: "UGX 750,000 /sem", gender: "Female", occupancy: "45/60 Occupied", rating: 4.0, reviews: 12, caretaker_phone: "0769559707", rooms_status: "Available", image: "/IMAGES/bensdorf.png" },
                    { id: 2, name: "SL Hostel", type: "university", price: "UGX 650,000 /sem", gender: "Male", occupancy: "85/100 Occupied", rating: 4.8, reviews: 24, caretaker_phone: "0744895697", rooms_status: "Available", image: "/IMAGES/sl.png" }
                ];
                const processedFallback = fallbackData.map(hostel => ({
                    ...hostel,
                    rooms: hostel.rooms_status || 'Available'
                }));
                setHostels(processedFallback);
                setFilteredHostels(processedFallback);
            } finally {
                setLoading(false);
            }
        };
        
        fetchHostels();
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

    const handleViewRooms = async (h) => {
        setSelectedHostel(h);
        setViewRoomsModal(true);
        setLoadingRooms(true);
        
        try {
            // Fetch rooms for this hostel from backend
            const response = await api.get(`/hostels/hostels/${h.id}/rooms/`);
            const roomsData = response.results || response;
            setRooms(roomsData || []);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            // Fallback to mock rooms if API fails
            const prefix = h.name.charAt(0).toUpperCase();
            const mockRooms = [
                { id: 1, room_number: `${prefix}1`, room_type: 'Single', capacity: 1, facilities: 'En-suite Bath, Desk, Wi-Fi', is_available: true },
                { id: 2, room_number: `${prefix}2`, room_type: 'Double', capacity: 2, facilities: 'Shared Bath, Wardrobe, Wi-Fi', is_available: true },
                { id: 3, room_number: `${prefix}3`, room_type: 'Dormitory', capacity: 4, facilities: 'Common Bath, Lockers, Wi-Fi', is_available: true },
                { id: 4, room_number: `${prefix}4`, room_type: 'Double', capacity: 2, facilities: 'En-suite Bath, Balcony, Wi-Fi', is_available: true },
                { id: 5, room_number: `${prefix}5`, room_type: 'Single', capacity: 1, facilities: 'Premium En-suite, A/C, Wi-Fi', is_available: true }
            ];
            setRooms(mockRooms);
        } finally {
            setLoadingRooms(false);
        }
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
                                    <button className={`h-btn-solid ${h.rooms?.toLowerCase() === 'full' ? 'full-btn' : ''}`} disabled={h.rooms?.toLowerCase() === 'full'} onClick={() => handleBookNow(h)}>
                                        {h.rooms?.toLowerCase() === 'full' ? 'Hostel Full' : 'Reserve Now'}
                                    </button>
                                </div>
                                <div className="h-custodian">
                                    <strong>Caretaker:</strong> {h.caretaker_phone}<br/>
                                    <a href={`tel:${h.caretaker_phone}`} style={{color: '#3b82f6', textDecoration: 'none'}}>
                                        📞 Call {h.caretaker_phone}
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
                ) : (
                    <>
                        {hostels.length === 2 && hostels[0].id === 1 && (
                            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>
                                <p style={{ color: '#9a3412', fontWeight: '500' }}>
                                    ⚠️ Connection Issue: Could not connect to the backend server. 
                                    Showing fallback data (Bensdorf and SL only). 
                                    Please ensure your Backend URL is correctly configured in Render environment variables.
                                </p>
                            </div>
                        )}
                        {filteredHostels.length === 0 ? (
                            <p className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>No hostels found matching your criteria.</p>
                        ) : (
                            <>
                                {renderHostelGrid('university', universityHostels)}
                                {renderHostelGrid('private', privateHostels)}
                            </>
                        )}
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
                            {loadingRooms ? (
                                <p style={{textAlign: 'center', padding: '2rem'}}>Loading rooms...</p>
                            ) : rooms.length > 0 ? (
                                <table className="rooms-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem'}}>
                                    <thead>
                                        <tr>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Room</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Type</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Capacity</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Occupancy</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Facilities</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map((room) => (
                                            <tr key={room.id}>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}><strong>{room.room_number}</strong></td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.room_type}</td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.capacity} People</td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>
                                                    <span style={{color: room.is_available ? '#10b981' : '#ef4444', fontWeight: '500'}}>
                                                        {room.current_occupancy}/{room.capacity}
                                                    </span>
                                                </td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b'}}>{room.facilities}</td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>
                                                    <button 
                                                        className="h-btn-solid" 
                                                        style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px'}} 
                                                        disabled={!room.is_available}
                                                        onClick={() => handleSelectRoom(selectedHostel, room.room_number)}
                                                    >
                                                        {room.is_available ? 'Select' : 'Occupied'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{textAlign: 'center', padding: '2rem'}}>No rooms available for this hostel.</p>
                            )}
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
                                        notes: notesInfo,
                                        transaction_id: document.getElementById('resTransactionId')?.value
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
                                    <option value="mobile_money">Mobile Money (Send to Caretaker)</option>
                                    <option value="upload_receipt">I have already paid (Upload Receipt)</option>
                                </select>

                                {paymentMethod === 'mobile_money' && (
                                    <div style={{marginTop: '1rem', background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
                                        <h4 style={{fontSize: '0.95rem', marginBottom: '0.5rem', color: '#1e293b'}}>Send Deposit to Caretaker</h4>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1'}}>
                                            <span style={{fontSize: '1.2rem'}}>📞</span>
                                            <div>
                                                <p style={{margin: 0, fontSize: '0.8rem', color: '#64748b'}}>Caretaker Phone:</p>
                                                <p style={{margin: 0, fontWeight: '700', color: '#1e293b'}}>{selectedHostel.caretaker_phone || '0772000000'}</p>
                                            </div>
                                        </div>
                                        
                                        <label htmlFor="resTransactionId">Transaction ID / Reference</label>
                                        <input type="text" id="resTransactionId" placeholder="e.g. 18273645" required />
                                        <p style={{fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem'}}>After sending the deposit, please enter the Transaction ID from the mobile money message above to confirm.</p>
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
