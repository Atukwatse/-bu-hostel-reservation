import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { displayUserName } from '../utils/userDisplayName';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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

    const steps = [
        { icon: '🔍', title: t('home.step1Title'), desc: t('home.step1Desc') },
        { icon: '📋', title: t('home.step2Title'), desc: t('home.step2Desc') },
        { icon: '🗝️', title: t('home.step3Title'), desc: t('home.step3Desc') }
    ];

    const features = [
        { icon: '🔍', title: t('home.easySearch'), desc: t('home.easySearchDesc') },
        { icon: '⚡', title: t('home.instantBooking'), desc: t('home.instantBookingDesc') },
        { icon: '🛡️', title: t('home.safeSecure'), desc: t('home.safeSecureDesc') },
        { icon: '📶', title: t('home.wifiIncluded'), desc: t('home.wifiDesc') }
    ];

    return (
        <section id="home" className="page-section active">
            {/* Hero */}
            <div className="hero">
                <div className="hero-content">
                    <h1>{t('home.heroTitle')}</h1>
                    <p>{t('home.heroSubtitle')}</p>
                    <div className="hero-buttons">
                        <button className="hero-btn primary" onClick={() => navigate('/hostels')}>{t('home.browseHostels')}</button>
                        {!currentUser && (
                            <>
                                <button className="hero-btn outline" onClick={() => navigate('/register')}>{t('nav.signUp')}</button>
                                <button className="hero-btn add-hostel" onClick={() => navigate('/register/caretaker')}>{t('nav.addYourHostel')}</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Trust Strip */}
            <div className="trust-strip">
                <span className="trust-item">🔒 {t('home.trustSecure')}</span>
                <span className="trust-item">✅ {t('home.trustVerified')}</span>
                <span className="trust-item">🕐 {t('home.trustSupport')}</span>
            </div>

            {/* Student Information Section */}
            {currentUser && (
                <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                    <div className="student-dashboard">
                        <h2 style={{ color: '#1e3a8a', marginBottom: '1.5rem', fontSize: '1.8rem' }}>
                            {t('home.welcome', { name: displayUserName(currentUser) })}
                        </h2>

                        {loading ? (
                            <p>{t('home.loading')}</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <div className="dashboard-card">
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.2rem' }}>🏨 {t('home.yourBookedHostel')}</h3>
                                    {studentReservation ? (
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {studentReservation.hostel_name || studentReservation.hostel?.name || t('home.unknownHostel')}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>{t('home.room')}:</strong> {studentReservation.room_number || t('home.notAssigned')}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>{t('home.status')}:</strong> {studentReservation.status || t('home.pending')}
                                            </p>
                                            <p style={{ color: '#64748b' }}>
                                                <strong>{t('home.bookingDate')}:</strong> {studentReservation.booking_date || studentReservation.check_in_date || t('common.nA')}
                                            </p>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                            {t('home.noHostelBooked')} <a href="/hostels" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{t('home.browseHostels')}</a>
                                        </p>
                                    )}
                                </div>

                                <div className="dashboard-card">
                                    <h3 style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '1.2rem' }}>👨‍👩‍👧 {t('home.yourNextOfKin')}</h3>
                                    {currentUser?.next_of_kin_name ? (
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                {currentUser.next_of_kin_name}
                                            </p>
                                            <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                                                <strong>{t('home.phone')}:</strong> {currentUser.next_of_kin_country_code || '+256'} {currentUser.next_of_kin_phone}
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
                                                📞 {t('home.callNextOfKin')}
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
                                                ✏️ {t('home.edit')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                {t('home.noNextOfKin')}
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
                                                ➕ {t('home.addNextOfKin')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* How It Works */}
            <div className="steps-section">
                <span className="section-eyebrow">{t('home.stepsEyebrow')}</span>
                <h2 className="section-title">{t('home.stepsTitle')}</h2>
                <p className="section-subtitle">{t('home.stepsSubtitle')}</p>
                <div className="steps-container">
                    {steps.map((step, i) => (
                        <div className="step-card" key={i}>
                            <div className="step-icon">{step.icon}</div>
                            <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div className="features-section">
                <span className="section-eyebrow">{t('home.whyChooseUs')}</span>
                <h2 className="section-title">{t('home.featuresHeading')}</h2>
                <p className="section-subtitle">{t('home.featuresSubtitle')}</p>
                <div className="features-container">
                    {features.map((f, i) => (
                        <div className="feature-card" key={i}>
                            <div className="f-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Banner */}
            <div className="cta-banner">
                <h3>{t('home.ctaTitle')}</h3>
                <p>{t('home.ctaSubtitle')}</p>
                <div className="hero-buttons cta-buttons">
                    <button className="hero-btn primary" onClick={() => navigate('/hostels')}>{t('home.browseHostels')}</button>
                    {!currentUser && (
                        <button className="hero-btn cta-signup" onClick={() => navigate('/register')}>{t('nav.signUp')}</button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Home;