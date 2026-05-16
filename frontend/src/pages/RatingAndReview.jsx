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
    
    // Form state
    const [formData, setFormData] = useState({
        hostel: '',
        rating: 5,
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
            
            // Handle paginated or non-paginated responses
            setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData.results || []));
            setHostels(Array.isArray(hostelsData) ? hostelsData : (hostelsData.results || []));
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load reviews. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleStarClick = (rating) => {
        setFormData({ ...formData, rating });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hostel) {
            setError('Please select a hostel to review.');
            return;
        }
        if (!formData.comment.trim()) {
            setError('Please provide a comment.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');
            
            await api.post(API_CONFIG.REVIEWS.CREATE, {
                hostel: parseInt(formData.hostel),
                rating: formData.rating,
                comment: formData.comment
            });

            setSuccess('Thank you! Your review has been submitted.');
            setFormData({ hostel: '', rating: 5, comment: '' });
            
            // Refresh reviews
            const updatedReviews = await api.get(API_CONFIG.REVIEWS.LIST);
            setReviews(Array.isArray(updatedReviews) ? updatedReviews : (updatedReviews.results || []));
        } catch (err) {
            setError(err.message || 'Failed to submit review. You may have already reviewed this hostel.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating, interactive = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    className={`star-btn ${i <= rating ? 'active' : ''} ${!interactive ? 'no-cursor' : ''}`}
                    onClick={interactive ? () => handleStarClick(i) : undefined}
                    disabled={!interactive}
                >
                    {i <= rating ? '★' : '☆'}
                </button>
            );
        }
        return stars;
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <section className="reviews-page page-section active">
            <div className="hero">
                <div className="floating-bg">
                    <img src="/IMAGES/home.png" className="float-img img-1" alt="Floating Home 1" />
                    <img src="/IMAGES/home2.png" className="float-img img-2" alt="Floating Home 2" />
                </div>
                <div className="hero-content">
                    <h1>Student Ratings & Reviews</h1>
                    <p>Hear from fellow students about their stay and share your own experience.</p>
                </div>
            </div>

            <div className="reviews-container">
                <div className="reviews-grid">
                    {/* Left: Review Form */}
                    <div className="review-form-side">
                        <div className="review-form-container">
                            <h2>Share Your Experience</h2>
                            
                            {!currentUser ? (
                                <div className="login-prompt-review">
                                    <p>Please sign in to leave a review for a hostel.</p>
                                    <Link to="/login" className="primary-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                                        Sign In Now
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="vertical-form">
                                    {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                                    {success && <div className="success-message" style={{ color: '#10b981', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}
                                    
                                    <label>Select Hostel</label>
                                    <select 
                                        value={formData.hostel} 
                                        onChange={(e) => setFormData({...formData, hostel: e.target.value})}
                                        required
                                    >
                                        <option value="">-- Choose a Hostel --</option>
                                        {hostels.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>

                                    <label>Rating</label>
                                    <div className="star-rating-input">
                                        {renderStars(formData.rating, true)}
                                    </div>

                                    <label>Your Review</label>
                                    <textarea 
                                        rows="4" 
                                        placeholder="Tell us about the facilities, security, and environment..."
                                        value={formData.comment}
                                        onChange={(e) => setFormData({...formData, comment: e.target.value})}
                                        required
                                    ></textarea>

                                    <button 
                                        type="submit" 
                                        className="primary-btn" 
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Post Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right: Reviews List */}
                    <div className="reviews-list-side">
                        <div className="reviews-list-container">
                            <h2>Student Feedback</h2>
                            
                            {loading ? (
                                <div className="loading-spinner">Loading reviews...</div>
                            ) : reviews.length === 0 ? (
                                <div className="empty-reviews">
                                    <p>No reviews yet. Be the first to share your experience!</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="review-card">
                                        <div className="review-header">
                                            <div className="reviewer-info">
                                                <h3>{review.user_name || 'Anonymous Student'}</h3>
                                                <div className="reviewed-hostel">Stayed at {review.hostel_name || 'Hostel'}</div>
                                            </div>
                                            <div className="review-date">{formatDate(review.created_at)}</div>
                                        </div>
                                        
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                        
                                        <div className="review-comment">
                                            "{review.comment}"
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RatingAndReview;
