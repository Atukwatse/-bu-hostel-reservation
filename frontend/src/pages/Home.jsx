import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { displayUserName } from '../utils/userDisplayName';

const Home = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [studentReservation, setStudentReservation] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (user) {
            setCurrentUser(user);
            fetchStudentInfo(user);
        }
    }, []);

    const fetchStudentInfo = async (user) => {
        try {
            setLoading(true);
            // Fetch student's reservations
            const reservationsRes = await api.get(API_CONFIG.RESERVATIONS.LIST);
            const allReservations = reservationsRes.results || reservationsRes;
            
            // Only pending or confirmed reservations count as active booked hostels
            const ACTIVE_STATUSES = ['pending', 'confirmed'];
            const myReservation = allReservations.find(r => {
                const rUserId = (r.user && typeof r.user === 'object') ? r.user.id : r.user;
                return Number(rUserId) === Number(user.id) && ACTIVE_STATUSES.includes(r.status);
            });

            if (myReservation) {
                setStudentReservation(myReservation);
            } else {
                setStudentReservation(null);
            }
        } catch (error) {
            console.error('Error fetching student info:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="home" className="page-section active">
            <div className="hero">
                {/* Floating Background Images */}
                <div className="floating-bg">
                    <img src="/IMAGES/home.png" className="float-img img-1" alt="Floating Home 1" />
                    <img src="/IMAGES/home2.png" className="float-img img-2" alt="Floating Home 2" />
                </div>

                <div className="hero-content">
                    <h1>Find Your Perfect Place on Campus</h1>
                    <p>Browse, compare and reserve student accommodation — all in one place.</p>
                    <div className="hero-buttons">
                        <button className="hero-btn primary" onClick={() => navigate('/hostels')}>View Hostels</button>
                        <button className="hero-btn outline" onClick={() => navigate('/register')}>Sign Up &rarr;</button>
                    </div>
                </div>
                
                <div className="stats-container">
                    {/* Stats removed per request */}
                </div>
            </div>

            {/* Student Information Section */}
            {currentUser && (
                <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(8px)', 
                        borderRadius: '12px', 
                        padding: '2rem', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h2 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
                            Welcome, {displayUserName(currentUser)}!
                        </h2>
                        
                        {loading ? (
                            <p>Loading your information...</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {/* Booked Hostel Information */}
                                <div style={{ 
                                    background: '#f8fafc', 
                                    padding: '1.5rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0' 
                                }}>
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.2rem' }}>🏨 Your Booked Hostel</h3>
                                    {studentReservation ? (
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {studentReservation.hostel_name || studentReservation.hostel?.name || 'Unknown Hostel'}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>Room:</strong> {studentReservation.room_number || 'Not Assigned'}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>Status:</strong> {studentReservation.status || 'Pending'}
                                            </p>
                                            <p style={{ color: '#64748b' }}>
                                                <strong>Booking Date:</strong> {studentReservation.booking_date || studentReservation.check_in_date || 'N/A'}
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                            No hostel booked yet. <a href="/hostels" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Browse available hostels</a>
                                        </p>
                                    )}
                                </div>

                                {/* Next of Kin Information */}
                                <div style={{ 
                                    background: '#f8fafc', 
                                    padding: '1.5rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0' 
                                }}>
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.2rem' }}>👨‍�‍👧 Your Next of Kin</h3>
                                    {currentUser?.next_of_kin_name ? (
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {currentUser.next_of_kin_name}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>Phone:</strong> {currentUser.next_of_kin_country_code || '+256'} {currentUser.next_of_kin_phone}
                                            </p>
                                            <a 
                                                href={`tel:${currentUser.next_of_kin_country_code || '+256'}${currentUser.next_of_kin_phone}`}
                                                style={{ 
                                                    display: 'inline-block', 
                                                    marginTop: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    background: '#3b82f6', 
                                                    color: 'white', 
                                                    textDecoration: 'none', 
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                📞 Call Next of Kin
                                            </a>
                                            <button
                                                onClick={() => navigate('/profile')}
                                                style={{
                                                    display: 'inline-block',
                                                    marginTop: '0.5rem',
                                                    marginLeft: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    background: '#f1f5f9',
                                                    color: '#1e3a8a',
                                                    border: '1px solid #cbd5e1',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                No next of kin information provided. Please update your profile to add emergency contact information.
                                            </p>
                                            <button
                                                onClick={() => navigate('/profile')}
                                                style={{
                                                    marginTop: '0.75rem',
                                                    padding: '0.5rem 1rem',
                                                    background: '#1e3a8a',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                ➕ Add Next of Kin
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="features-section">
                <h4 className="features-title">WHY CHOOSE US</h4>
                <div className="features-container">
                    <div className="feature-card">
                        <div className="f-icon">🔍</div>
                        <h3>Easy Search</h3>
                        <p>Filter by gender and price.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon">⚡</div>
                        <h3>Instant Booking</h3>
                        <p>Reserve your room online.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon">🛡️</div>
                        <h3>Safe & Secure</h3>
                        <p>24-hour security, CCTV.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon">📶</div>
                        <h3>Wi-Fi Included</h3>
                        <p>High-speed internet.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Home;
