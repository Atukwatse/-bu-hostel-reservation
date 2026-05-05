import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

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
