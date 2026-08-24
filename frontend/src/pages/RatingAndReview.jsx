import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';

const RatingAndReview = () => {
    const [reviews, setReviews] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterHostel, setFilterHostel] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [hoveredStar, setHoveredStar] = useState(0);

    const [formData, setFormData] = useState({
        hostel: '',
        rating: 0,
        comment: ''
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsData, hostelsData] = await Promise.all([
                api.get(API_CONFIG.REVIEWS.LIST),
                api.get(API_CONFIG.HOSTELS.LIST)
            ]);
            setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData.results || []));
            setHostels(Array.isArray(hostelsData) ? hostelsData : (hostelsData.results || []));
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load reviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hostel) { setError('Please select a hostel.'); return; }
        if (formData.rating === 0) { setError('Please select a star rating.'); return; }
        if (!formData.comment.trim()) { setError('Please write a comment.'); return; }

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            await api.post(API_CONFIG.REVIEWS.CREATE, {
                hostel: parseInt(formData.hostel),
                rating: formData.rating,
                comment: formData.comment.trim()
            });

            setSuccess('🎉 Thank you! Your review has been posted successfully.');
            setFormData({ hostel: '', rating: 0, comment: '' });
            setHoveredStar(0);

            // Re-fetch to show new review
            const updatedReviews = await api.get(API_CONFIG.REVIEWS.LIST);
            setReviews(Array.isArray(updatedReviews) ? updatedReviews : (updatedReviews.results || []));
        } catch (err) {
            setError(err.message || 'Failed to submit. You may have already reviewed this hostel.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const renderNumericRating = (rating) => (
        <span style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: '600' }}>{rating} / 5</span>
    );

    // Replace interactive star rating with a numeric select dropdown
    const ratingOptions = [1,2,3,4,5];
    const renderRatingSelect = () => (
        <select
            value={formData.rating}
            onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) })}
            style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem'
            }}
        >
            <option value="0" style={{ background: '#1e293b' }}>-- Choose Rating --</option>
            {ratingOptions.map(r => (
                <option key={r} value={r} style={{ background: '#1e293b' }}>{r} / 5</option>
            ))}
        </select>
    );

    const filteredReviews = reviews.filter(r => {
        const hostelMatch = filterHostel === 'all' || String(r.hostel) === filterHostel;
        const ratingMatch = filterRating === 'all' || String(r.rating) === filterRating;
        return hostelMatch && ratingMatch;
    });

    const averageRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const ratingCounts = [5,4,3,2,1].map(r => ({
        stars: r,
        count: reviews.filter(rev => rev.rating === r).length,
        pct: reviews.length ? Math.round((reviews.filter(rev => rev.rating === r).length / reviews.length) * 100) : 0
    }));

    return (
        <section className="page-section active" style={{ 
            minHeight: '100vh', 
            backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.9)), url("/IMAGES/home2.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}>

            {/* Hero Banner */}
            <div style={{
                background: 'transparent',
                padding: '4rem 2rem 3rem',
                textAlign: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-30%', right: '5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⭐</div>
                    <h1 style={{ color: '#ffffff', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        Student Ratings &amp; Reviews
                    </h1>
                    <p style={{ color: '#e2e8f0', marginTop: '0.75rem', fontSize: '1.1rem', maxWidth: '550px', margin: '0.75rem auto 0', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                        Read honest reviews from fellow students and share your own hostel experience.
                    </p>

                    {/* Stats bar */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{averageRating}</div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '4px', fontWeight: '500' }}>Overall Rating</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', alignSelf: 'stretch' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#60a5fa', lineHeight: 1 }}>{reviews.length}</div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '4px', fontWeight: '500' }}>Total Reviews</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', alignSelf: 'stretch' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399', lineHeight: 1 }}>{hostels.length}</div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '4px', fontWeight: '500' }}>Hostels Reviewed</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Rating Distribution */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem' }}>
                        <h3 style={{ color: '#ffffff', margin: '0 0 1rem', fontWeight: '700', fontSize: '1.05rem' }}>Rating Breakdown</h3>
                        {ratingCounts.map(({ stars, count, pct }) => (
                            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ color: '#fbbf24', fontSize: '1rem', width: '60px', whiteSpace: 'nowrap' }}>{stars} / 5</span>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: '999px', transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', width: '30px', textAlign: 'right' }}>{count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Write a Review Form */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem' }}>
                        <h3 style={{ color: '#ffffff', margin: '0 0 1.25rem', fontWeight: '700', fontSize: '1.05rem' }}>
                            ✏️ Write a Review
                        </h3>

                        {!currentUser ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
                                <p style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: '0.95rem' }}>Sign in to share your hostel experience</p>
                                <Link to="/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                                    Sign In to Review
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                {success && (
                                    <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        {success}
                                    </div>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Select Hostel *</label>
                                    <select
                                        value={formData.hostel}
                                        onChange={e => setFormData({ ...formData, hostel: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '0.9rem' }}
                                    >
                                        <option value="" style={{ background: '#1e293b' }}>-- Choose a Hostel --</option>
                                        {hostels.map(h => (
                                            <option key={h.id} value={h.id} style={{ background: '#1e293b' }}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Your Rating *</label>
                                    {renderRatingSelect()}
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Your Review *</label>
                                    <textarea
                                        rows="5"
                                        placeholder="Tell other students about the facilities, security, environment, caretaker..."
                                        value={formData.comment}
                                        onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', fontSize: '0.9rem', resize: 'vertical', lineHeight: '1.5', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ width: '100%', padding: '0.8rem', background: submitting ? '#475569' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                                >
                                    {submitting ? '⏳ Submitting...' : '📤 Post Review'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN — Reviews List */}
                <div>
                    {/* Filter Bar */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600' }}>FILTER:</span>
                        <select
                            value={filterHostel}
                            onChange={e => setFilterHostel(e.target.value)}
                            style={{ padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                        >
                            <option value="all" style={{ background: '#1e293b' }}>All Hostels</option>
                            {hostels.map(h => (
                                <option key={h.id} value={String(h.id)} style={{ background: '#1e293b' }}>{h.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterRating}
                            onChange={e => setFilterRating(e.target.value)}
                            style={{ padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                        >
                            <option value="all" style={{ background: '#1e293b' }}>All Ratings</option>
                            {[5,4,3,2,1].map(r => (
                                <option key={r} value={String(r)} style={{ background: '#1e293b' }}>{r} / 5</option>
                            ))}
                        </select>
                        <span style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500' }}>
                            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Reviews */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#cbd5e1' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                            Loading reviews...
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                            <p style={{ color: '#e2e8f0', fontSize: '1.05rem' }}>No reviews yet for this filter.</p>
                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.5rem' }}>Be the first to share your experience!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {filteredReviews.map(review => (
                                <div key={review.id} style={{
                                    background: 'rgba(30, 41, 59, 0.45)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '1.25rem 1.5rem',
                                    transition: 'transform 0.2s, border-color 0.2s',
                                    cursor: 'default',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    {/* Reviewer header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                                                {(review.user_name || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.95rem' }}>{review.user_name || 'Anonymous Student'}</div>
                                                <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}>Reviewed on {formatDate(review.created_at)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                            {renderNumericRating(review.rating)}
                                            <span style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                🏠 {review.hostel_name || 'Hostel'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <p style={{ color: '#f8fafc', lineHeight: '1.65', fontSize: '0.95rem', margin: 0, padding: '0.85rem', background: 'rgba(15, 23, 42, 0.45)', borderRadius: '8px', borderLeft: '3px solid rgba(59,130,246,0.5)', fontStyle: 'italic' }}>
                                        "{review.comment}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Responsive fix for small screens */}
            <style>{`
                @media (max-width: 768px) {
                    section > div:last-child {
                        grid-template-columns: 1fr !important;
                    }
                }
                select option { background: #1e293b; color: #fff; }
                textarea::placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
            `}</style>
        </section>
    );
};

export default RatingAndReview;
