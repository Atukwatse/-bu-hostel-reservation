import React, { useState, useEffect, useRef } from 'react';
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
    // Mobile Money (admin-approval) flow
    const [mmNumber, setMmNumber] = useState('');
    const [mmAmount, setMmAmount] = useState('');
    const [mmSent, setMmSent] = useState(false);
    const [mmError, setMmError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [bookingTermsAccepted, setBookingTermsAccepted] = useState(false);
    const bookingDatePickerRef = useRef(null);

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
        resetMobileMoneyFlow();
        setAcceptedTerms(false);
        setBookingTermsAccepted(false);
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
        resetMobileMoneyFlow();
        setAcceptedTerms(false);
        setBookingTermsAccepted(false);
        setViewRoomsModal(false);
        setReservationModal(true);
    };

    const handleViewRoomDetails = (room) => {
        setSelectedRoomDetails(room);
        setRoomDetailsModal(true);
    };

    const closeReservationModal = () => {
        resetMobileMoneyFlow();
        setReservationModal(false);
    };

    const resetMobileMoneyFlow = () => {
        setMmNumber('');
        setMmAmount('');
        setMmSent(false);
        setMmError('');
    };

    const normalizeBookingDate = (value, inputEl) => {
        const v = (value || '').trim();
        if (!v) return;
        let normalized = '';
        const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (iso) {
            normalized = `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
        } else {
            const dm = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
            if (dm) {
                const day = String(dm[1]).padStart(2, '0');
                const mon = String(dm[2]).padStart(2, '0');
                let yr = dm[3];
                if (yr.length === 2) yr = '20' + yr;
                normalized = `${yr}-${mon}-${day}`;
            }
        }
        if (normalized && inputEl) {
            inputEl.value = normalized;
        }
    };

    const confirmMoneySent = () => {
        setMmError('');
        const cleanNumber = mmNumber.replace(/[\s-]/g, '');
        if (!/^0\d{9}$/.test(cleanNumber)) {
            setMmError('Enter a valid mobile money number, e.g. 0772123456.');
            return;
        }
        const amt = parseFloat(mmAmount);
        if (!amt || amt <= 0) {
            setMmError('Enter the amount you sent.');
            return;
        }
        setMmSent(true);
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
    const semesterFee = selectedHostel ? (parseFloat((selectedHostel.price || '').replace(/[^0-9.-]+/g, '')) || 0) : 0;
    const depositAmount = Math.round(semesterFee * 0.5);

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
                        <span className="close-modal" onClick={closeReservationModal}>&times;</span>
                        <h2>Reserve a Room at {selectedHostel.name}</h2>

                        {!bookingTermsAccepted ? (
                            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '300px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                                <h3 style={{ margin: '0 0 0.75rem 0', color: '#0f172a' }}>Terms &amp; Conditions</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.6 }}>
                                    Please read and accept our booking terms before continuing to reserve a room.
                                </p>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', margin: '1rem 0', maxWidth: '420px', textAlign: 'left' }}>
                                    <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                        <strong>Room Satisfaction Guarantee:</strong> If you do not like the room at check-in, you may cancel the
                                        booking and the <strong>caretaker will refund your money</strong>.
                                    </p>
                                </div>
                                <button type="button" className="primary-btn black-btn" onClick={() => setBookingTermsAccepted(true)}>
                                    I Agree, Continue Booking
                                </button>
                                <p className="form-footer-text">
                                    <button type="button" onClick={closeReservationModal} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
                                        Cancel
                                    </button>
                                </p>
                            </div>
                        ) : (
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

                                if (paymentMethod === 'mobile_money' && !mmSent) {
                                    alert('Please confirm that you have sent the money first.');
                                    return;
                                }

                                const passportInput = document.getElementById('passportPhotoUpload');
                                if (!passportInput || !passportInput.files || passportInput.files.length === 0) {
                                    alert('Please upload your passport photo for identification.');
                                    return;
                                }

                                if (!acceptedTerms) {
                                    alert('Please read and accept the Terms and Conditions before reserving.');
                                    return;
                                }

                                const priceString = selectedHostel.price || '0';
                                const totalAmount = parseFloat(priceString.replace(/[^0-9.-]+/g,"")) || 0;
                                let notesInfo = `Gender: ${document.getElementById('resGender')?.value}, Room Type: ${document.getElementById('resRoomType')?.value}, Room Number: ${document.getElementById('resRoomNumber')?.value || selectedRoom}`;
                                if (paymentMethod === 'mobile_money') {
                                    notesInfo += `, Payer MoMo Number: ${mmNumber}, Amount Sent: ${mmAmount ? 'UGX ' + Number(mmAmount).toLocaleString() : 'N/A'}, Paid To (Caretaker): ${selectedHostel.caretaker_phone || '0769559707'}, Status: Awaiting admin approval`;
                                }
                                
                                const bookingDate = (() => {
                                    const raw = document.getElementById('resBookingDate')?.value || '';
                                    if (!raw) return '';
                                    const m = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                                    if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
                                    const d = raw.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
                                    if (d) {
                                        const day = String(d[1]).padStart(2, '0');
                                        const mon = String(d[2]).padStart(2, '0');
                                        let yr = d[3];
                                        if (yr.length === 2) yr = '20' + yr;
                                        return `${yr}-${mon}-${day}`;
                                    }
                                    return raw;
                                })();
                                let checkOutStr = '2024-12-20';
                                if (bookingDate) {
                                    const bookingDateVal = new Date(bookingDate);
                                    if (!isNaN(bookingDateVal.getTime())) {
                                        const checkOutDateVal = new Date(bookingDateVal);
                                        checkOutDateVal.setMonth(checkOutDateVal.getMonth() + 4);
                                        checkOutStr = checkOutDateVal.toISOString().split('T')[0];
                                    }
                                }

                                // Always use FormData so we can include the passport photo file
                                const formData = new FormData();
                                formData.append('hostel', selectedHostel.id);
                                formData.append('payment_method', document.getElementById('paymentMethod')?.value);
                                formData.append('total_amount', totalAmount);
                                formData.append('semester', 'Fall 2024');
                                formData.append('academic_year', '2024-2025');
                                formData.append('check_in_date', bookingDate || '2024-09-01');
                                formData.append('check_out_date', checkOutStr);
                                formData.append('booking_date', bookingDate);
                                formData.append('transaction_id', '');
                                formData.append('notes', notesInfo);

                                if (passportInput.files.length > 0) {
                                    formData.append('passport_photo', passportInput.files[0]);
                                }

                                if (paymentMethod === 'mobile_money') {
                                    formData.append('mm_number', mmNumber);
                                    formData.append('mm_amount', parseFloat(mmAmount) || 0);
                                    formData.append('caretaker_phone', selectedHostel.caretaker_phone || '0769559707');
                                }

                                const receiptInput = document.getElementById('receiptUpload');
                                if (receiptInput && receiptInput.files.length > 0) {
                                    formData.append('receipt_image', receiptInput.files[0]);
                                }
                                
                                response = await api.upload(API_CONFIG.RESERVATIONS.CREATE, formData);
                                
                                if (paymentMethod === 'mobile_money') {
                                    alert('Your reservation has been submitted!\n\nThe hostel caretaker will confirm your payment, and an admin will approve it on the admin dashboard. You will see the payment status update once approved.');
                                } else {
                                    alert('Reservation successful! Your room has been reserved.');
                                }
                                resetMobileMoneyFlow();
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

                            <label htmlFor="resGender">Gender</label>
                            <select id="resGender" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>

                            <label htmlFor="resBookingDate">Booking Date</label>
                            <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    id="resBookingDate"
                                    required
                                    placeholder="Click calendar icon or type date (YYYY-MM-DD or DD/MM/YYYY)"
                                    onBlur={(e) => normalizeBookingDate(e.target.value, e.target)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', paddingRight: '2.5rem' }}
                                />
                                <span
                                    onClick={() => bookingDatePickerRef.current?.showPicker ? bookingDatePickerRef.current.showPicker() : bookingDatePickerRef.current?.click()}
                                    title="Open calendar"
                                    style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', cursor: 'pointer', color: '#1e3a8a', background: 'none', border: 'none', padding: '0.25rem' }}
                                >📅</span>
                                <input
                                    type="date"
                                    ref={bookingDatePickerRef}
                                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            document.getElementById('resBookingDate').value = e.target.value;
                                        }
                                    }}
                                />
                            </div>

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

                            <label>Passport Photo (for identification)</label>
                            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
                                    Please upload a recent <strong>passport photo</strong> of yourself. This helps the hostel caretaker and admin identify you when you check in.
                                </p>
                                <input
                                    type="file"
                                    id="passportPhotoUpload"
                                    accept="image/*"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                                />
                            </div>
                            
                            <div className="deposit-section">
                                <h3>Payment Details</h3>
                                <p style={{marginBottom: '10px'}}>A 50% deposit is required to secure your booking.</p>
                                
                                <label htmlFor="paymentMethod">Payment Method</label>
                                <select id="paymentMethod" value={paymentMethod} onChange={(e) => {
                                    const next = e.target.value;
                                    if (paymentMethod === 'mobile_money' && next !== 'mobile_money') {
                                        resetMobileMoneyFlow();
                                    }
                                    setPaymentMethod(next);
                                }} required>
                                    <option value="">Select Method</option>
                                    <option value="mobile_money">Mobile Money (Send to Caretaker)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="upload_receipt">I have already paid (Upload Receipt)</option>
                                </select>

                                {paymentMethod === 'mobile_money' && (
                                    <div style={{marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderLeft: '4px solid #10b981', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '1rem'}}>
                                        <h4 style={{marginBottom: '0.5rem', color: '#065f46', fontSize: '0.95rem'}}>Pay by Mobile Money to the Caretaker</h4>
                                        <p style={{fontSize: '0.88rem', marginBottom: '0.9rem', lineHeight: 1.5}}>
                                            1. Send the 50% deposit of <strong style={{color: '#047857'}}>UGX {depositAmount.toLocaleString()}</strong> to the caretaker below.<br/>
                                            2. Enter your sender number and the amount.<br/>
                                            3. An admin will verify and approve your payment — the Transaction ID is generated automatically on approval.
                                        </p>

                                        <div style={{background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.9rem'}}>
                                            <div style={{fontSize: '0.78rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em'}}>Send money to this caretaker number</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#065f46', fontFamily: 'monospace'}}>{selectedHostel.caretaker_phone || '0769559707'}</div>
                                        </div>

                                        {!mmSent ? (
                                            <>
                                                <label htmlFor="mmNumber" style={{display: 'block', marginBottom: '0.25rem'}}>Your Mobile Money Number (sender)</label>
                                                <input
                                                    type="tel"
                                                    id="mmNumber"
                                                    value={mmNumber}
                                                    onChange={(e) => setMmNumber(e.target.value.replace(/[^\d]/g, ''))}
                                                    placeholder="e.g. 0772123456"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}
                                                />

                                                <label htmlFor="mmAmount" style={{display: 'block', marginBottom: '0.25rem'}}>Amount Sent (UGX)</label>
                                                <input
                                                    type="number"
                                                    id="mmAmount"
                                                    value={mmAmount}
                                                    onChange={(e) => setMmAmount(e.target.value)}
                                                    placeholder={`e.g. ${depositAmount}`}
                                                    min="1"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}
                                                />

                                                {mmError && (
                                                    <p style={{fontSize: '0.85rem', color: '#ef4444', margin: '0 0 0.75rem 0'}}>{mmError}</p>
                                                )}

                                                <button
                                                    type="button"
                                                    className="primary-btn"
                                                    onClick={confirmMoneySent}
                                                    style={{width: '100%', marginBottom: '0.5rem'}}
                                                >
                                                    I have sent the money
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                    <span style={{flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem'}}>&#10003;</span>
                                                    <strong style={{color: '#065f46', fontSize: '0.95rem'}}>Note recorded — ready to submit</strong>
                                                </div>
                                                <p style={{margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#065f46', lineHeight: 1.5}}>
                                                    You noted that you sent <strong>UGX {Number(mmAmount).toLocaleString()}</strong> from <strong>{mmNumber}</strong> to{' '}
                                                    <strong>{selectedHostel.caretaker_phone || '0769559707'}</strong>.<br/>
                                                    Click <strong>Submit Reservation</strong> below. Once submitted, the admin will review and approve your payment later — you'll see a confirmation once it's approved.
                                                </p>
                                                <button
                                                    type="button"
                                                    style={{marginTop: '0.75rem', background: 'none', border: '1px solid #10b981', color: '#065f46', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}}
                                                    onClick={resetMobileMoneyFlow}
                                                >
                                                    Edit details
                                                </button>
                                            </div>
                                        )}
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

                            <div className="terms-section" style={{ marginTop: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem' }}>
                                <h3 style={{ margin: '0 0 0.75rem 0', color: '#92400e', fontSize: '1rem' }}>Terms &amp; Conditions</h3>
                                <div style={{ fontSize: '0.88rem', color: '#78350f', lineHeight: 1.6 }}>
                                    <p style={{ margin: '0 0 0.75rem 0' }}>
                                        <strong>Room Satisfaction Guarantee:</strong> We want you to be comfortable. When you check in, if you do not like the room you have reserved, you may cancel the booking and the <strong>caretaker will refund your money</strong>.
                                    </p>
                                    <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.25rem' }}>
                                        <li>Your 50% deposit secures the room for you and is refundable if you reject the room at check-in.</li>
                                        <li>The refund comes from the hostel caretaker, not from the university.</li>
                                        <li>Follow the booking and hostel conditions, and treat the hostel property with care.</li>
                                    </ul>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', color: '#78350f', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        style={{ marginTop: '0.1rem', width: '16px', height: '16px' }}
                                    />
                                    <span>I have read and agree to the Terms &amp; Conditions above.</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={(paymentMethod === 'mobile_money' && !mmSent) || !acceptedTerms}
                                title={paymentMethod === 'mobile_money' && !mmSent ? 'Confirm that you have sent the money first' : !acceptedTerms ? 'Read and accept the Terms and Conditions first' : undefined}
                            >
                                {paymentMethod === 'mobile_money' && mmSent
                                    ? 'Submit Reservation for Approval'
                                    : paymentMethod === 'mobile_money' && !mmSent
                                        ? 'Confirm You Sent the Money First'
                                        : 'Confirm Reservation'}
                            </button>
                        </form>
                        )}
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
