import React, { useState, useEffect } from 'react';
import { api, API_CONFIG } from '../services/api';
import '../AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [hostels, setHostels] = useState([]);
    const [users, setUsers] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [caretakers, setCaretakers] = useState([]);
    const [stats, setStats] = useState({ totalHostels: 0, students: 0, reservations: 0, available: 0 });
    const [showHostelModal, setShowHostelModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showCaretakerModal, setShowCaretakerModal] = useState(false);
    const [editingHostel, setEditingHostel] = useState(null);
    const [editingCaretaker, setEditingCaretaker] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
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
                occupancy: `${hostel.available_rooms !== undefined ? hostel.available_rooms : 0}/${hostel.total_rooms || 0}`,
                status: hostel.rooms_status || 'Available'
            })));

            const allUsers = usersRes.results || usersRes;
            console.log('All users from API:', allUsers); // Debug log
            const students = allUsers.filter(u => u.role !== 'caretaker' && u.role !== 'admin');
            setUsers(students);
            
            let filteredCaretakers = allUsers.filter(u => u.role === 'caretaker');
            console.log('Filtered caretakers:', filteredCaretakers); // Debug log
            
            // If no caretakers found, add fallback data for testing
            if (filteredCaretakers.length === 0) {
                console.log('No caretakers found, adding fallback data');
                filteredCaretakers = [
                    { id: 1, name: 'ATUKWATSE BLESSING', email: 'atukwatse@bugema.ac.ug', phone: '0769559707', gender: 'Male', role: 'caretaker' },
                    { id: 2, name: 'AHEBWA SAVIO', email: 'ahebwa@bugema.ac.ug', phone: '0744895697', gender: 'Male', role: 'caretaker' },
                    { id: 3, name: 'NABWAMI ROSE', email: 'nabwami@bugema.ac.ug', phone: '0772345678', gender: 'Female', role: 'caretaker' }
                ];
            }
            
            setCaretakers(filteredCaretakers);

            const allReservations = reservationsRes.results || reservationsRes;
            setReservations(allReservations.map(res => ({
                ...res,
                student: res.user_name || res.user?.name || 'Unknown',
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
            setLoading(false);
        }
    };

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
            const payload = {
                ...hostelData,
                rating: hostelData.rating || 0.0,
                reviews: hostelData.reviews || 0
            };
            if (editingHostel) {
                // Update existing hostel
                const updatedHostel = await api.patch(API_CONFIG.HOSTELS.DETAIL(editingHostel.id), payload);
                setHostels(hostels.map(h => h.id === editingHostel.id ? { ...h, ...updatedHostel } : h));
                alert('Hostel updated successfully');
            } else {
                // Add new hostel
                const newHostel = await api.post(API_CONFIG.HOSTELS.LIST, payload);
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
        setShowRoomModal(true);
    };

    const handleSaveRoom = async (roomData) => {
        try {
            const newRoom = await api.post(API_CONFIG.ROOMS.CREATE, roomData);
            alert('Room added successfully');
            setShowRoomModal(false);
            // Refresh hostels to show updated room counts
            fetchAdminData();
        } catch (error) {
            console.error('Error saving room:', error);
            alert(`Failed to save room: ${error.message}`);
        }
    };

    const handleConfirmReservation = async (reservationId) => {
        if (window.confirm('Are you sure you want to confirm this reservation?')) {
            try {
                await api.post(API_CONFIG.RESERVATIONS.CONFIRM(reservationId));
                alert('Reservation confirmed successfully');
                fetchAdminData();
            } catch (error) {
                console.error('Error confirming reservation:', error);
                alert('Failed to confirm reservation');
            }
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (window.confirm('Are you sure you want to cancel this reservation?')) {
            try {
                await api.post(API_CONFIG.RESERVATIONS.CANCEL(reservationId));
                alert('Reservation cancelled successfully');
                fetchAdminData();
            } catch (error) {
                console.error('Error cancelling reservation:', error);
                alert('Failed to cancel reservation');
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
            if (editingCaretaker) {
                // Update existing caretaker
                const updatedCaretaker = await api.patch(`/users/users/${editingCaretaker.id}/`, caretakerData);
                setCaretakers(caretakers.map(c => c.id === editingCaretaker.id ? { ...c, ...updatedCaretaker } : c));
                alert('Caretaker updated successfully');
            } else {
                // Add new caretaker
                const newCaretaker = await api.post('/users/users/', { ...caretakerData, role: 'caretaker' });
                setCaretakers([...caretakers, newCaretaker]);
                alert('Caretaker added successfully');
            }
            setShowCaretakerModal(false);
            setEditingCaretaker(null);
        } catch (error) {
            console.error('Error saving caretaker:', error);
            alert('Failed to save caretaker');
        }
    };

    const renderTabContent = () => {
        if (activeTab === 'dashboard') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Dashboard Overview</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Welcome, Admin</p>
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
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Capacity</th>
                                    <th>Price/Sem</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hostels.map(h => (
                                    <tr key={h.id}>
                                        <td>{h.name}</td>
                                        <td>{h.type}</td>
                                        <td>{h.occupancy}</td>
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
                                <th>Student ID</th>
                                <th>Email</th>
                                <th>Gender</th>
                                <th>Course</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.student_id}</td>
                                    <td>{u.email}</td>
                                    <td>{u.gender}</td>
                                    <td>{u.program_of_study}</td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan="5" className="text-center" style={{color:'#64748b', textAlign: 'center'}}>No students registered yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            );
        } else if (activeTab === 'caretakers') {
            return (
                <div className="admin-tab-content active">
                    <div className="admin-top-bar">
                        <h2>Caretakers Management</h2>
                        <button className="primary-btn black-btn" style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem'}}>+ Add Caretaker</button>
                    </div>
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
                                    <td>{caretaker.name}</td>
                                    <td>{caretaker.phone}</td>
                                    <td>{caretaker.email}</td>
                                    <td>
                                        {hostels.filter(h => h.caretaker_phone === caretaker.phone).map(h => h.name).join(', ') || 'None'}
                                    </td>
                                    <td>
                                        <button className="btn-edit" style={{marginRight: '5px'}}>Edit</button>
                                        <button className="btn-delete">Delete</button>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(reservation => (
                                <tr key={reservation.id}>
                                    <td>{reservation.reservation_code}</td>
                                    <td>{reservation.student}</td>
                                    <td>{reservation.hostel}</td>
                                    <td>{reservation.room_number || 'Not Assigned'}</td>
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
                                    <td colSpan="8" style={{textAlign: 'center', color: '#64748b'}}>No reservations found</td>
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
                        <button className="primary-btn black-btn" style={{margin:0, padding: '0.5rem 1rem', width: 'auto', fontSize: '0.85rem'}} onClick={handleAddCaretaker}>+ Add Caretaker</button>
                    </div>
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
                                    <td>{caretaker.name}</td>
                                    <td>{caretaker.phone}</td>
                                    <td>{caretaker.email}</td>
                                    <td>
                                        {hostels.filter(h => h.caretaker_phone === caretaker.phone).map(h => h.name).join(', ') || 'None'}
                                    </td>
                                    <td>
                                        <button className="btn-edit" style={{marginRight: '5px'}} onClick={() => handleEditCaretaker(caretaker)}>Edit</button>
                                        <button className="btn-delete" onClick={() => handleDeleteCaretaker(caretaker.id)}>Delete</button>
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
            occupancy: editingHostel?.occupancy || '0/0'
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
            room_number: '',
            hostel: '',
            room_type: 'Single',
            capacity: 1,
            price_per_semester: '',
            facilities: '',
            is_available: true
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
                    width: '90%', maxWidth: '500px'
                }}>
                    <h3>Add New Room</h3>
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

                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button type="button" onClick={() => setShowRoomModal(false)}
                                style={{padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', background: 'white'}}>
                                Cancel
                            </button>
                            <button type="submit"
                                style={{padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', background: '#000', color: 'white'}}>
                                Add Room
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
            name: editingCaretaker?.name || '',
            email: editingCaretaker?.email || '',
            phone: editingCaretaker?.phone || '',
            gender: editingCaretaker?.gender || 'Male'
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
                }}>
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
            <CaretakerModal />
        </section>
    );
};

export default AdminDashboard;
