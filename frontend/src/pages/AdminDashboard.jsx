import React, { useState, useEffect, useRef } from 'react';
import { api, API_CONFIG } from '../services/api';
import { displayUserName } from '../utils/userDisplayName';
import '../AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [hostels, setHostels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [caretakers, setCaretakers] = useState([]);
    const [stats, setStats] = useState({ totalHostels: 0, students: 0, reservations: 0, available: 0 });
    const [showHostelModal, setShowHostelModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showCaretakerModal, setShowCaretakerModal] = useState(false);
    const [editingHostel, setEditingHostel] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);
    const [editingCaretaker, setEditingCaretaker] = useState(null);
    const [selectedManageHostel, setSelectedManageHostel] = useState('');
    const [loading, setLoading] = useState(false);
    const adminDataBootstrapped = useRef(false);

    const fetchAdminData = async ({ withSpinner = true } = {}) => {
        if (withSpinner) setLoading(true);
        try {
            // Fetch real data from APIs
            const [hostelsRes, usersRes, reservationsRes] = await Promise.all([
                api.get(API_CONFIG.HOSTELS.LIST),
                api.get('/users/users/'),
                api.get(API_CONFIG.RESERVATIONS.LIST)
            ]);

            const allHostels = hostelsRes.results || hostelsRes;
            setHostels(allHostels.map(hostel => ({
                ...hostel,
                occupancy: (hostel.total_rooms > 0) ? `${hostel.available_rooms}/${hostel.total_rooms}` : hostel.occupancy || 'N/A',
                status: hostel.rooms_status || 'Available'
            })));

            const allUsers = usersRes.results || usersRes;
            const withDisplayName = (u) => ({ ...u, name: displayUserName(u) });
            const students = allUsers
                .filter(u => u.role !== 'caretaker' && u.role !== 'admin')
                .map(withDisplayName);
            setUsers(students);

            const filteredCaretakers = allUsers
                .filter(u => u.role === 'caretaker')
                .map(withDisplayName);
            setCaretakers(filteredCaretakers);

            const allReservations = reservationsRes.results || reservationsRes;
            setReservations(allReservations.map(res => ({
                ...res,
                student: res.user_name || displayUserName(res.user) || 'Unknown',
                hostel: res.hostel_name || res.hostel?.name || 'Unknown',
                date: res.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
            })));

            setStats({
                totalHostels: allHostels.length || 0,
                students: students.length || 0,
                reservations: allReservations.length || 0,
                available: allHostels.filter(h => h.rooms_status === 'Available').length || 0
            });

        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            // Fallback to mock data if API fails
            setHostels([
                { id: 1, name: "Bensdorf Hostel", type: "university", occupancy: "45/60", price: "UGX 750,000 /sem", status: "Available" },
                { id: 2, name: "SL Hostel", type: "university", occupancy: "85/100", price: "UGX 650,000 /sem", status: "Available" }
            ]);
            setStats({ totalHostels: 2, students: 0, reservations: 0, available: 2 });
        } finally {
            if (withSpinner) setLoading(false);
        }
    };

    useEffect(() => {
        if (!adminDataBootstrapped.current) {
            adminDataBootstrapped.current = true;
            fetchAdminData({ withSpinner: true });
            return;
        }
        fetchAdminData({ withSpinner: false });
    }, [activeTab]);

    // Fetch rooms and images when a specific hostel is selected for management
    useEffect(() => {
        const fetchHostelDetails = async () => {
            if (!selectedManageHostel) {
                setRooms([]);
                return;
            }

            try {
                setLoading(true);
                // Fetch specific rooms for this hostel AND full hostel details (for gallery images)
                const [roomsRes, hostelDetail] = await Promise.all([
                    api.get(API_CONFIG.ROOMS.LIST, { hostel: selectedManageHostel }),
                    api.get(API_CONFIG.HOSTELS.DETAIL(selectedManageHostel))
                ]);

                const fetchedRooms = roomsRes.results || roomsRes;
                setRooms(fetchedRooms);

                // Update the hostel in our list with full details (images, etc)
                setHostels(prev => prev.map(h => 
                    h.id === parseInt(selectedManageHostel, 10) ? { ...h, ...hostelDetail } : h
                ));
            } catch (error) {
                console.error('Error fetching hostel details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'manage-rooms') {
            fetchHostelDetails();
        }
    }, [selectedManageHostel, activeTab]);

    const handleAddHostel = () => {
        setEditingHostel(null);
        setShowHostelModal(true);
    };

    const handleEditHostel = (hostel) => {
        setEditingHostel(hostel);
        setShowHostelModal(true);
    };

    const handleDeleteHostel = async (hostelId) => {
        if (window.confirm('Are you sure you want to delete this hostel?')) {
            try {
                await api.delete(API_CONFIG.HOSTELS.DETAIL(hostelId));
                setHostels(hostels.filter(h => h.id !== hostelId));
                alert('Hostel deleted successfully');
            } catch (error) {
                console.error('Error deleting hostel:', error);
                alert(`Failed to delete hostel: ${error.message}`);
            }
        }
    };

    const handleSaveHostel = async (hostelData) => {
        try {
            const formData = new FormData();
            
            // Append all text fields
            Object.keys(hostelData).forEach(key => {
                if (key !== 'image' && hostelData[key] !== null && hostelData[key] !== undefined) {
                    formData.append(key, hostelData[key]);
                }
            });
            
            // Default fields
            if (!formData.has('rating')) formData.append('rating', 0.0);
            if (!formData.has('reviews')) formData.append('reviews', 0);
            
            // Append image if present and is a File
            if (hostelData.image && typeof hostelData.image !== 'string') {
                formData.append('image', hostelData.image);
            }

            if (editingHostel) {
                // Update existing hostel
                const updatedHostel = await api.upload(API_CONFIG.HOSTELS.DETAIL(editingHostel.id), formData, 'PATCH');
                setHostels(hostels.map(h => h.id === editingHostel.id ? { ...h, ...updatedHostel } : h));
                alert('Hostel updated successfully');
            } else {
                // Add new hostel
                const newHostel = await api.upload(API_CONFIG.HOSTELS.LIST, formData, 'POST');
                setHostels([...hostels, newHostel]);
                alert('Hostel added successfully');
            }
            setShowHostelModal(false);
            setEditingHostel(null);
        } catch (error) {
            console.error('Error saving hostel:', error);
            alert(`Failed to save hostel: ${error.message}`);
        }
    };

    const handleAddRoom = () => {
        setEditingRoom(null);
        setShowRoomModal(true);
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setShowRoomModal(true);
    };

    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await api.delete(API_CONFIG.ROOMS.DETAIL(roomId));
                setRooms(rooms.filter(r => r.id !== roomId));
                alert('Room deleted successfully');
            } catch (error) {
                console.error('Error deleting room:', error);
                alert(`Failed to delete room: ${error.message}`);
            }
        }
    };

    const handleSaveRoom = async (roomData) => {
        try {
            const payload = {
                ...roomData,
                hostel: parseInt(roomData.hostel, 10),
                capacity: Number(roomData.capacity),
                price_per_semester: Number(roomData.price_per_semester),
                is_available: Boolean(roomData.is_available),
            };

            if (editingRoom) {
                const updatedRoom = await api.patch(API_CONFIG.ROOMS.DETAIL(editingRoom.id), payload);
                setRooms(rooms.map(r => r.id === editingRoom.id ? updatedRoom : r));
                alert('Room updated successfully');
            } else {
                const newRoom = await api.post(API_CONFIG.ROOMS.CREATE, payload);
                setRooms([...rooms, newRoom]);
                alert('Room added successfully');
            }
            
            setShowRoomModal(false);
            setEditingRoom(null);
            // Refresh hostels to show updated room counts
            fetchAdminData({ withSpinner: false });
        } catch (error) {
            console.error('Error saving room:', error);
            let errorMessage = error.message;
            if (errorMessage.toLowerCase().includes('unique set') || errorMessage.toLowerCase().includes('already exists')) {
                errorMessage = 'A room with this number already exists in the selected hostel.';
            }
            alert(`Failed to save room: ${errorMessage}`);
        }
    };

    const handleConfirmReservation = async (reservationId) => {
        if (window.confirm('Are you sure you want to confirm this reservation?')) {
            try {
                await api.post(API_CONFIG.RESERVATIONS.CONFIRM(reservationId), {});
                alert('Reservation confirmed successfully');
                fetchAdminData({ withSpinner: false });
            } catch (error) {
                console.error('Error confirming reservation:', error);
                alert(`Failed to confirm reservation: ${error.message}`);
            }
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (window.confirm('Are you sure you want to cancel this reservation?')) {
            try {
                await api.post(API_CONFIG.RESERVATIONS.CANCEL(reservationId), {});
                alert('Reservation cancelled successfully');
                fetchAdminData({ withSpinner: false });
            } catch (error) {
                console.error('Error cancelling reservation:', error);
                alert(`Failed to cancel reservation: ${error.message}`);
            }
        }
    };

    // Caretaker handler functions
    const handleAddCaretaker = () => {
        setEditingCaretaker(null);
        setShowCaretakerModal(true);
    };

    const handleEditCaretaker = (caretaker) => {
        setEditingCaretaker(caretaker);
        setShowCaretakerModal(true);
    };

    const handleDeleteCaretaker = async (caretakerId) => {
        if (window.confirm('Are you sure you want to delete this caretaker?')) {
            try {
                await api.delete(`/users/users/${caretakerId}/`);
                setCaretakers(caretakers.filter(c => c.id !== caretakerId));
                alert('Caretaker deleted successfully');
            } catch (error) {
                console.error('Error deleting caretaker:', error);
                alert('Failed to delete caretaker');
            }
        }
    };

    const handleSaveCaretaker = async (caretakerData) => {
        try {
            const rawName = caretakerData.name.trim();
            const parts = rawName.split(/\s+/);
            const first_name = parts[0] || '';
            const last_name = parts.length > 1 ? parts.slice(1).join(' ') : '';
            
            let caretakerPhone = caretakerData.phone.trim();
            
            if (editingCaretaker) {
                const patchPayload = {
                    first_name,
                    last_name,
                    email: caretakerData.email.trim(),
                    phone: caretakerPhone,
                    gender: caretakerData.gender,
                };
                const updatedCaretaker = await api.patch(`/users/users/${editingCaretaker.id}/`, patchPayload);
                const merged = { ...updatedCaretaker, name: displayUserName(updatedCaretaker) };
                setCaretakers(caretakers.map(c => (c.id === editingCaretaker.id ? merged : c)));
                alert('Caretaker updated successfully');
            } else {
                if (caretakerData.password !== caretakerData.password_confirm) {
                    alert('Passwords do not match');
                    return;
                }
                const newCaretaker = await api.post(API_CONFIG.USERS.CARETAKERS_CREATE, {
                    name: rawName,
                    email: caretakerData.email.trim(),
                    phone: caretakerPhone,
                    gender: caretakerData.gender,
                    password: 'Caretaker@2026!',
                    password_confirm: 'Caretaker@2026!',
                });
                setCaretakers([...caretakers, { ...newCaretaker, name: displayUserName(newCaretaker) }]);
                alert('Caretaker added successfully');
            }
            
            // Assign to hostel by updating hostel's caretaker_phone
            if (caretakerData.assigned_hostel) {
                await api.patch(API_CONFIG.HOSTELS.DETAIL(caretakerData.assigned_hostel), {
                    caretaker_phone: caretakerPhone
                });
                fetchAdminData({ withSpinner: false }); // Refresh hostels to reflect new caretaker
            }
            
            setShowCaretakerModal(false);
            setEditingCaretaker(null);
        } catch (error) {
            console.error('Error saving caretaker:', error);
            alert(`Failed to save caretaker: ${error.message}`);
        }
    };
    
    const extractRoomFromNotes = (notes) => {
        if (!notes) return null;
        const match = notes.match(/Room Number:\s*([^,]+)/i);
        return match ? match[1].trim() : null;
    };

    const renderTabContent = () => {
        let adminWelcome = 'Admin';
        try {
            const u = JSON.parse(localStorage.getItem('currentUser') || 'null');
            adminWelcome = displayUserName(u) || 'Admin';
        } catch {
            adminWelcome = 'Admin';
        }

        if (activeTab === 'dashboard') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Dashboard Overview</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Welcome, {adminWelcome}</p>
                    </div>
                    <div className="admin-dashboard-cards">
                        <div className="admin-card">
                            <span className="card-title">Total Hostels</span>
                            <strong>{stats.totalHostels}</strong>
                            <span className="card-desc">Active</span>
                        </div>
                        <div className="admin-card">
                            <span className="card-title">Students</span>
                            <strong>{stats.students}</strong>
                            <span className="card-desc">Registered</span>
                        </div>
                        <div className="admin-card">
                            <span className="card-title">Reservations</span>
                            <strong>{stats.reservations}</strong>
                            <span className="card-desc">This semester</span>
                        </div>
                        <div className="admin-card">
                            <span className="card-title">Available</span>
                            <strong>{stats.available}</strong>
                            <span className="card-desc">Open rooms</span>
                        </div>
                    </div>
                    <div className="admin-recent-activity">
                        <h3>Recent Activity</h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Student</th>
                                    <th>Hostel</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.slice(0, 5).map(reservation => (
                                    <tr key={reservation.id}>
                                        <td>Room Reservation</td>
                                        <td>{reservation.student}</td>
                                        <td>{reservation.hostel}</td>
                                        <td>{reservation.date}</td>
                                    </tr>
                                ))}
                                {reservations.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center" style={{color:'#64748b', textAlign: 'center'}}>No activity yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        } else if (activeTab === 'manage-hostels') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Manage Hostels & Rooms</h2>
                        <div>
                            <button className="primary-btn black-btn" onClick={handleAddRoom} style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem', marginRight: '10px'}}>+ Add Room</button>
                            <button className="primary-btn black-btn" onClick={handleAddHostel} style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem'}}>+ Add Hostel</button>
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price/Sem</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hostels.map(h => (
                                    <tr key={h.id}>
                                        <td>
                                            {h.image ? (
                                                <img src={h.image} alt={h.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>No Img</div>
                                            )}
                                        </td>
                                        <td>{h.name}</td>
                                        <td>{h.type}</td>
                                        <td>{h.price}</td>
                                        <td>{h.status}</td>
                                        <td>
                                            <button className="btn-edit" onClick={() => handleEditHostel(h)} style={{marginRight: '5px'}}>Edit</button>
                                            <button className="btn-delete" onClick={() => handleDeleteHostel(h.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {hostels.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{textAlign: 'center', color: '#64748b'}}>No hostels found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        } else if (activeTab === 'students') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar" style={{marginBottom: '5px'}}>
                        <h2>Registered Students</h2>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Gender</th>
                                <th>Course</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{displayUserName(u)}</td>
                                    <td>{u.email}</td>
                                    <td>{u.gender}</td>
                                    <td>{u.program_of_study}</td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="4" className="text-center" style={{color:'#64748b', textAlign: 'center'}}>No students registered yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'reservations') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Reservations Management</h2>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Reservation Code</th>
                                <th>Student</th>
                                <th>Hostel</th>
                                <th>Room</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Transaction ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(reservation => (
                                <tr key={reservation.id}>
                                    <td>{reservation.reservation_code}</td>
                                    <td>{reservation.student}</td>
                                    <td>{reservation.hostel}</td>
                                    <td>{reservation.room_number || extractRoomFromNotes(reservation.notes) || 'Not Assigned'}</td>
                                    <td>UGX {reservation.total_amount?.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${reservation.status}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`payment-status ${reservation.payment_status}`}>
                                            {reservation.payment_status}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{fontSize: '0.85rem', color: '#1e293b', fontWeight: '500'}}>
                                            {reservation.payments && reservation.payments.length > 0 
                                                ? reservation.payments[0].transaction_id || 'N/A' 
                                                : 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        {reservation.status === 'pending' && (
                                            <button 
                                                className="btn-confirm" 
                                                style={{marginRight: '5px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'}}
                                                onClick={() => handleConfirmReservation(reservation.id)}
                                            >
                                                Confirm
                                            </button>
                                        )}
                                        {reservation.status !== 'cancelled' && (
                                            <button 
                                                className="btn-cancel"
                                                style={{backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'}}
                                                onClick={() => handleCancelReservation(reservation.id)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reservations.length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{textAlign: 'center', color: '#64748b'}}>No reservations found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'caretakers') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Caretakers Management</h2>
                        <button type="button" className="primary-btn black-btn" style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem'}} onClick={handleAddCaretaker}>+ Add Caretaker</button>
                    </div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Assigned Hostels</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caretakers.map(caretaker => (
                                    <tr key={caretaker.id}>
                                        <td>{displayUserName(caretaker)}</td>
                                        <td>{caretaker.phone}</td>
                                        <td>{caretaker.email}</td>
                                        <td>
                                            {hostels.filter(h => h.caretaker_phone === caretaker.phone).map(h => h.name).join(', ') || 'None'}
                                        </td>
                                        <td>
                                            <button type="button" className="btn-edit" style={{marginRight: '5px'}} onClick={() => handleEditCaretaker(caretaker)}>Edit</button>
                                            <button type="button" className="btn-delete" onClick={() => handleDeleteCaretaker(caretaker.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {caretakers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center', color: '#64748b'}}>No caretakers found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        } else if (activeTab === 'manage-rooms') {
            const currentHostel = hostels.find(h => h.id === parseInt(selectedManageHostel, 10));
            const filteredRooms = selectedManageHostel 
                ? rooms.filter(r => {
                    const roomHostelId = typeof r.hostel === 'object' ? r.hostel.id : r.hostel;
                    return parseInt(roomHostelId, 10) === parseInt(selectedManageHostel, 10);
                })
                : [];

            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h2>Manage Rooms</h2>
                            <button 
                                className="primary-btn black-btn" 
                                onClick={handleAddRoom} 
                                style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem'}}
                                disabled={!selectedManageHostel}
                                title={!selectedManageHostel ? "Please select a hostel first" : ""}
                            >
                                + Add Room
                            </button>
                        </div>
                        
                        <div style={{ width: '100%', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#475569' }}>Select Hostel to Manage Rooms:</label>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select 
                                    value={selectedManageHostel} 
                                    onChange={(e) => setSelectedManageHostel(e.target.value)}
                                    style={{ width: '100%', maxWidth: '350px', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                                >
                                    <option value="">-- Choose a Hostel --</option>
                                    {hostels.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                                
                                {currentHostel && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        {currentHostel.image ? (
                                            <img src={currentHostel.image} alt={currentHostel.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>No Image</div>
                                        )}
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{currentHostel.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{currentHostel.location || 'No location'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!selectedManageHostel ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b', background: '#fff', borderRadius: '8px', marginTop: '1rem', border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                            <p style={{ fontSize: '1.1rem' }}>Please select a hostel from the dropdown above to view and manage its rooms.</p>
                        </div>
                    ) : loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>
                                    Rooms for {currentHostel?.name}
                                </h3>
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Total Rooms: {filteredRooms.length}
                                </div>
                            </div>
                            
                            {currentHostel?.images && currentHostel.images.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>Hostel Gallery Images</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {currentHostel.images.map((img, idx) => (
                                            <img key={idx} src={img.image} alt={`Gallery ${idx}`} style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Room #</th>
                                        <th>Type</th>
                                        <th>Capacity</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRooms.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.room_number}</td>
                                            <td>{r.room_type}</td>
                                            <td>{r.capacity}</td>
                                            <td>UGX {Number(r.price_per_semester).toLocaleString()}</td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: r.is_available ? '#dcfce7' : '#fee2e2',
                                                    color: r.is_available ? '#166534' : '#991b1b'
                                                }}>
                                                    {r.is_available ? 'Available' : 'Occupied'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-edit" onClick={() => handleEditRoom(r)} style={{marginRight: '5px'}}>Edit</button>
                                                <button className="btn-delete" onClick={() => handleDeleteRoom(r.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRooms.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{textAlign: 'center', color: '#64748b', padding: '3rem'}}>
                                                <p>No rooms found for this hostel.</p>
                                                <button className="primary-btn black-btn" onClick={handleAddRoom} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}>Add First Room</button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        } else {
             return <div className="admin-tab-content active"><p>Section under construction feature to be ported...</p></div>;
        }
    };

    const HostelModal = () => {
        const [formData, setFormData] = useState({
            name: editingHostel?.name || '',
            type: editingHostel?.type || 'university',
            location: editingHostel?.location || '',
            description: editingHostel?.description || '',
            facilities: editingHostel?.facilities || '',
            price: editingHostel?.price || '',
            gender: editingHostel?.gender || 'Male',
            caretaker_phone: editingHostel?.caretaker_phone || '',
            rooms_status: editingHostel?.rooms_status || 'Available',
            image: null
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleSaveHostel(formData);
        };

        if (!showHostelModal) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                    width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto'
                }}>
                    <h3>{editingHostel ? 'Edit Hostel' : 'Add New Hostel'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Hostel Name *</label>
                            <input
                                type="text" required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>
                        
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Type *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="university">University</option>
                                <option value="private">Private</option>
                            </select>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Location *</label>
                            <input
                                type="text" required
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Price per Semester *</label>
                            <input
                                type="text" required
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                placeholder="e.g., UGX 500,000"
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Caretaker Phone *</label>
                            <input
                                type="text" required
                                value={formData.caretaker_phone}
                                onChange={(e) => setFormData({...formData, caretaker_phone: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Gender *</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Mixed">Mixed</option>
                            </select>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Hostel Image</label>
                            <input
                                type="file" accept="image/*"
                                onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                            {editingHostel && editingHostel.image && (
                                <div style={{marginTop: '0.5rem', fontSize: '0.85rem', color: '#666'}}>
                                    Current image uploaded. Select a new one to replace it.
                                </div>
                            )}
                        </div>

                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button type="button" onClick={() => setShowHostelModal(false)}
                                style={{padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white'}}>
                                Cancel
                            </button>
                            <button type="submit"
                                style={{padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#000', color: 'white'}}>
                                {editingHostel ? 'Update' : 'Add'} Hostel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Room Modal Component
    const RoomModal = () => {
        const [formData, setFormData] = useState({
            room_number: editingRoom?.room_number || '',
            hostel: editingRoom?.hostel || selectedManageHostel || '',
            room_type: editingRoom?.room_type || 'Single',
            capacity: editingRoom?.capacity || 1,
            price_per_semester: editingRoom?.price_per_semester || '',
            facilities: editingRoom?.facilities || '',
            is_available: editingRoom?.is_available !== undefined ? editingRoom.is_available : true
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleSaveRoom(formData);
        };

        if (!showRoomModal) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                    width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto'
                }}>
                    <h3>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Room Number *</label>
                            <input
                                type="text" required
                                value={formData.room_number}
                                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Hostel *</label>
                            <select
                                value={formData.hostel}
                                onChange={(e) => setFormData({...formData, hostel: e.target.value})}
                                required
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="">Select Hostel</option>
                                {hostels.map(hostel => (
                                    <option key={hostel.id} value={hostel.id}>{hostel.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Room Type *</label>
                            <select
                                value={formData.room_type}
                                onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Dormitory">Dormitory</option>
                            </select>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Capacity *</label>
                            <input
                                type="number" required min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Price per Semester *</label>
                            <input
                                type="number" required step="0.01"
                                value={formData.price_per_semester}
                                onChange={(e) => setFormData({...formData, price_per_semester: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Facilities</label>
                            <textarea
                                value={formData.facilities}
                                onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                                placeholder="e.g. Wi-Fi, AC, Attached Bathroom"
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                                />
                                Room is Available
                            </label>
                        </div>

                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button type="button" onClick={() => setShowRoomModal(false)}
                                style={{padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white'}}>
                                Cancel
                            </button>
                            <button type="submit"
                                style={{padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#000', color: 'white'}}>
                                {editingRoom ? 'Update' : 'Add'} Room
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Caretaker Modal Component
    const CaretakerModal = () => {
        const [formData, setFormData] = useState({
            name: editingCaretaker ? displayUserName(editingCaretaker) : '',
            email: editingCaretaker?.email || '',
            phone: editingCaretaker?.phone || '',
            gender: editingCaretaker?.gender || 'Male',
            password: '',
            password_confirm: '',
            assigned_hostel: hostels.find(h => h.caretaker_phone === editingCaretaker?.phone)?.id || ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleSaveCaretaker(formData);
        };

        if (!showCaretakerModal) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                        width: '90%', maxWidth: '500px'
                    }}
                >
                    <h3>{editingCaretaker ? 'Edit Caretaker' : 'Add New Caretaker'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Full Name *</label>
                            <input
                                type="text" required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. John Doe"
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Email Address *</label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="e.g. john.doe@example.com"
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Phone Number *</label>
                            <input
                                type="tel" required
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="e.g. 0712345678"
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            />
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Gender *</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem'}}>Assign Hostel</label>
                            <select
                                value={formData.assigned_hostel}
                                onChange={(e) => setFormData({...formData, assigned_hostel: e.target.value})}
                                style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                            >
                                <option value="">Select Hostel (Optional)</option>
                                {hostels.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>

                        {!editingCaretaker && (
                            <>
                                <div style={{marginBottom: '1rem'}}>
                                    <label style={{display: 'block', marginBottom: '0.5rem'}}>Password *</label>
                                    <input
                                        type="password" required={!editingCaretaker}
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                                    />
                                </div>
                                <div style={{marginBottom: '1rem'}}>
                                    <label style={{display: 'block', marginBottom: '0.5rem'}}>Confirm password *</label>
                                    <input
                                        type="password" required={!editingCaretaker}
                                        value={formData.password_confirm}
                                        onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                                        style={{width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px'}}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button type="button" onClick={() => setShowCaretakerModal(false)}
                                style={{padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white'}}>
                                Cancel
                            </button>
                            <button type="submit"
                                style={{padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#000', color: 'white'}}>
                                {editingCaretaker ? 'Update' : 'Add'} Caretaker
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <section id="admin-panel" className="page-section active" style={{ padding: 0 }}>
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <div className="admin-header">
                        <h2>ADMIN PANEL</h2>
                    </div>
                    <ul className="admin-nav" style={{ listStyle: 'none', padding: 0 }}>
                        <li><button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Dashboard</button></li>
                        <li><button className={`admin-nav-item ${activeTab === 'manage-hostels' ? 'active' : ''}`} onClick={() => setActiveTab('manage-hostels')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Manage Hostels</button></li>
                        <li><button className={`admin-nav-item ${activeTab === 'manage-rooms' ? 'active' : ''}`} onClick={() => setActiveTab('manage-rooms')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Manage Rooms</button></li>
                        <li><button className={`admin-nav-item ${activeTab === 'caretakers' ? 'active' : ''}`} onClick={() => setActiveTab('caretakers')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Caretakers</button></li>
                        <li><button className={`admin-nav-item ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Reservations</button></li>
                        <li><button className={`admin-nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')} style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '1rem'}}>Students</button></li>
                    </ul>
                </aside>
                
                <div className="admin-main">
                    {renderTabContent()}
                </div>
            </div>
            
            {/* Modals */}
            <HostelModal />
            <RoomModal />
            <CaretakerModal key={showCaretakerModal ? (editingCaretaker ? `e-${editingCaretaker.id}` : 'new') : 'closed'} />
        </section>
    );
};

export default AdminDashboard;
