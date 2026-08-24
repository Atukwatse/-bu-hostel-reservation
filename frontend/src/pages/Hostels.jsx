import React, { useState, useEffect } from 'react';
import { api, API_CONFIG } from '../services/api';
import '../Hostels.css';

const Hostels = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
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
    const [roomDetailsModal, setRoomDetailsModal] = useState(false);
    const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
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
        if (!currentUser) {
            alert('Please sign up or log in first to reserve a room.');
            window.location.href = '/register';
            return;
        }
        setSelectedHostel(h);
        setSelectedRoom(null); // Reset selected room when opening directly
        setReservationModal(true);
    };

    const handleSelectRoom = (h, roomName) => {
        if (!currentUser) {
            alert('Please sign up or log in first to reserve a room.');
            window.location.href = '/register';
            return;
        }
        setSelectedHostel(h);
        setSelectedRoom(roomName);
        setViewRoomsModal(false);
        setReservationModal(true);
    };

    const handleViewRoomDetails = (room) => {
        setSelectedRoomDetails(room);
        setRoomDetailsModal(true);
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
                        <div className="rooms-container">
                            {loadingRooms ? (
                                <p style={{textAlign: 'center', padding: '2rem'}}>Loading rooms...</p>
                            ) : rooms.length > 0 ? (
                                <table className="rooms-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem'}}>
                                    <thead>
                                        <tr>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Image</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Room</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Type</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Capacity</th>
                                            <th style={{padding: '0.75rem', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '600'}}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map((room) => (
                                            <tr key={room.id}>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>
                                                    {room.image && !room.image.includes('placeholder.jpg') ? (
                                                        <img src={room.image} alt={room.room_number} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>No Img</div>
                                                    )}
                                                </td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}><strong>{room.room_number}</strong></td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.room_type}</td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>{room.capacity} People</td>
                                                <td style={{padding: '0.75rem', borderBottom: '1px solid #e2e8f0'}}>
                                                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                                        <button 
                                                            className="h-btn-solid" 
                                                            style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px'}} 
                                                            disabled={!room.is_available}
                                                            onClick={() => handleSelectRoom(selectedHostel, room.room_number)}
                                                        >
                                                            {room.is_available ? 'Select' : 'Occupied'}
                                                        </button>
                                                        <button 
                                                            className="h-btn-outline" 
                                                            style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px', whiteSpace: 'nowrap'}} 
                                                            onClick={() => handleViewRoomDetails(room)}
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
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
                                const regNoInput = document.getElementById('resStudentRegNo')?.value || '';
                                const regNoClean = regNoInput.trim().toUpperCase();
                                
                                // Validate Reg No: YY/COURSE/BU/R/XXXX (4 digits)
                                const regNoRegex = /^\d{2}\/[A-Za-z]+\/BU\/R\/\d{4}$/i;
                                if (!regNoRegex.test(regNoClean)) {
                                    alert('Invalid Student Registration Number format!\n\nIt must match: YY/COURSE/BU/R/XXXX\n- YY: Year (e.g., 24)\n- COURSE: Course code (e.g., BSE)\n- BU & R: Constants\n- XXXX: Exactly 4 digits (e.g., 0008)\n\nExample: 24/BSE/BU/R/0008');
                                    return;
                                }

                                const isUpload = document.getElementById('paymentMethod')?.value === 'upload_receipt';
                                let response;
                                
                                const priceString = selectedHostel.price || '0';
                                const totalAmount = parseFloat(priceString.replace(/[^0-9.-]+/g,"")) || 0;
                                const notesInfo = `Student Reg No: ${regNoClean}, Gender: ${document.getElementById('resGender')?.value}, Room Type: ${document.getElementById('resRoomType')?.value}, Room Number: ${document.getElementById('resRoomNumber')?.value || selectedRoom}`;
                                
                                const bookingDate = document.getElementById('resBookingDate')?.value || '';
                                let checkOutStr = '2024-12-20';
                                if (bookingDate) {
                                    const bookingDateVal = new Date(bookingDate);
                                    const checkOutDateVal = new Date(bookingDateVal);
                                    checkOutDateVal.setMonth(checkOutDateVal.getMonth() + 4);
                                    checkOutStr = checkOutDateVal.toISOString().split('T')[0];
                                }
                                const transactionId = document.getElementById('transactionId')?.value || '';

                                if (isUpload) {
                                    const formData = new FormData();
                                    formData.append('hostel', selectedHostel.id);
                                    formData.append('payment_method', document.getElementById('paymentMethod')?.value);
                                    formData.append('total_amount', totalAmount);
                                    formData.append('semester', 'Fall 2024');
                                    formData.append('academic_year', '2024-2025');
                                    formData.append('check_in_date', bookingDate || '2024-09-01');
                                    formData.append('check_out_date', checkOutStr);
                                    formData.append('booking_date', bookingDate);
                                    formData.append('transaction_id', transactionId);
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
                                        check_in_date: bookingDate || '2024-09-01',
                                        check_out_date: checkOutStr,
                                        booking_date: bookingDate,
                                        transaction_id: transactionId,
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
                            {currentUser && (
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reserving As</div>
                                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e3a8a' }}>{currentUser.name || currentUser.username}</div>
                                    </div>
                                </div>
                            )}

                            <label htmlFor="resStudentRegNo">Student Registration Number</label>
                            <input type="text" id="resStudentRegNo" placeholder="e.g. 24/BSE/BU/R/0008" required />
                            <small style={{fontSize: '0.75rem', color: '#64748b', marginTop: '5px', display: 'block', marginBottom: '1rem'}}>
                                Format: YY/COURSE/BU/R/XXXX (e.g., 24/BSE/BU/R/0008) where the last part is a 4-digit number.
                            </small>

                            <label htmlFor="resGender">Gender</label>
                            <select id="resGender" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>

                            <label htmlFor="resBookingDate">Booking Date</label>
                            <input type="date" id="resBookingDate" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }} />

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
                                    <option value="mobile_money">Mobile Money (Caretaker Line)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="upload_receipt">I have already paid (Upload Receipt)</option>
                                </select>

                                {paymentMethod === 'mobile_money' && (
                                    <div style={{marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderLeft: '4px solid #10b981', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '1rem'}}>
                                        <h4 style={{marginBottom: '0.5rem', color: '#065f46', fontSize: '0.95rem'}}>Caretaker Mobile Money Number</h4>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.8rem'}}>
                                            Please send the money to the caretaker's number:
                                            <strong style={{color: '#047857', marginLeft: '5px', fontSize: '1.05rem'}}>{selectedHostel.caretaker_phone || '0769559707'}</strong>
                                        </p>
                                        
                                        <label htmlFor="mmNumber" style={{display: 'block', marginBottom: '0.25rem'}}>Your Mobile Money Number</label>
                                        <input type="tel" id="mmNumber" placeholder="e.g. 0772123456" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }} />
                                        
                                        <label htmlFor="transactionId" style={{display: 'block', marginBottom: '0.25rem'}}>Transaction ID</label>
                                        <input type="text" id="transactionId" placeholder="Enter Transaction ID (e.g. PP240622...)" required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }} />
                                        
                                        <p style={{fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', margin: 0}}>
                                            After sending the money, copy the transaction ID from the MM receipt/SMS and paste it above.
                                        </p>
                                    </div>
                                )}

                                {paymentMethod === 'bank_transfer' && (
                                    <div style={{marginTop: '1rem', background: '#ffffff', padding: '1rem', borderLeft: '4px solid #3b82f6', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '1rem'}}>
                                        <h4 style={{marginBottom: '0.5rem', color: '#1e3a8a', fontSize: '0.95rem'}}>University Bank Details</h4>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}><strong>Bank:</strong> Centenary Bank</p>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}><strong>Account Name:</strong> Bugema University Hostels</p>
                                        <p style={{fontSize: '0.9rem', marginBottom: '0.8rem'}}><strong>Account Number:</strong> 3100012345000</p>
                                        <p style={{fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4'}}>Please transfer your 50% deposit to the account above, then upload your receipt below to verify.</p>
                                    </div>
                                )}

                                {paymentMethod === 'upload_receipt' && (
                                    <div style={{marginTop: '1rem', marginBottom: '1rem'}}>
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
            {/* Room Details Modal */}
            {roomDetailsModal && selectedRoomDetails && (
                <div className="modal show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                    <div className="modal-content" style={{maxWidth: '500px'}}>
                        <span className="close-modal" onClick={() => setRoomDetailsModal(false)}>&times;</span>
                        <h2>Room {selectedRoomDetails.room_number} Details</h2>
                        <div style={{marginTop: '1rem'}}>
                            {selectedRoomDetails.image && !selectedRoomDetails.image.includes('placeholder.jpg') ? (
                                <img src={selectedRoomDetails.image} alt="Room" style={{width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}} />
                            ) : (
                                <div style={{width: '100%', height: '250px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.2rem'}}>
                                    No Image Available
                                </div>
                            )}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div>
                                    <h4 style={{color: '#475569', marginBottom: '0.25rem'}}>Room Type</h4>
                                    <p style={{fontWeight: '600'}}>{selectedRoomDetails.room_type}</p>
                                </div>
                                <div>
                                    <h4 style={{color: '#475569', marginBottom: '0.25rem'}}>Capacity</h4>
                                    <p style={{fontWeight: '600'}}>{selectedRoomDetails.capacity} People</p>
                                </div>
                                <div style={{gridColumn: '1 / -1'}}>
                                    <h4 style={{color: '#475569', marginBottom: '0.25rem'}}>Facilities</h4>
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                                        {selectedRoomDetails.facilities ? selectedRoomDetails.facilities.split(',').map((fac, idx) => (
                                            <span key={idx} style={{background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: '0.85rem', color: '#334155'}}>
                                                {fac.trim()}
                                            </span>
                                        )) : 'None specified'}
                                    </div>
                                </div>
                                <div style={{gridColumn: '1 / -1', marginTop: '0.5rem'}}>
                                    <h4 style={{color: '#475569', marginBottom: '0.25rem'}}>Status</h4>
                                    <p style={{fontWeight: '600', color: selectedRoomDetails.is_available ? '#10b981' : '#ef4444'}}>
                                        {selectedRoomDetails.is_available ? 'Available for Booking' : 'Currently Occupied'}
                                    </p>
                                </div>
                            </div>
                            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                                <button className="h-btn-outline" onClick={() => setRoomDetailsModal(false)}>Close</button>
                                {selectedRoomDetails.is_available && (
                                    <button 
                                        className="h-btn-solid" 
                                        onClick={() => {
                                            setRoomDetailsModal(false);
                                            handleSelectRoom(selectedHostel, selectedRoomDetails.room_number);
                                        }}
                                    >
                                        Select this Room
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hostels;
