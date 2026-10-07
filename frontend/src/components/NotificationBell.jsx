import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const loadTimerRef = useRef(null);

    const isLoggedIn = () => {
        try {
            return !!(localStorage.getItem('authToken') && localStorage.getItem('currentUser'));
        } catch {
            return false;
        }
    };

    const fetchUnreadCount = async () => {
        if (!isLoggedIn()) return;
        try {
            const res = await api.get(API_CONFIG.NOTIFICATIONS.UNREAD_COUNT);
            setUnread(res.count || 0);
        } catch (e) {
            // Ignore polling errors silently
        }
    };

    const fetchNotifications = async () => {
        if (!isLoggedIn()) return;
        setLoading(true);
        try {
            const res = await api.get(API_CONFIG.NOTIFICATIONS.LIST);
            const items = (res.results || res || []).slice(0, 20);
            setNotifications(items);
            setUnread(items.filter(n => !n.is_read).length);
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn()) {
            fetchUnreadCount();
            loadTimerRef.current = setInterval(fetchUnreadCount, 30000);
        }
        return () => clearInterval(loadTimerRef.current);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) {
            fetchNotifications();
        }
    };

    const handleClickNotification = async (notification) => {
        if (!notification.is_read) {
            try {
                await api.post(API_CONFIG.NOTIFICATIONS.MARK_READ(notification.id), {});
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
                setUnread(prev => Math.max(0, prev - 1));
            } catch (e) {
                console.error('Failed to mark notification read:', e);
            }
        }
        if (notification.link) {
            setOpen(false);
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post(API_CONFIG.NOTIFICATIONS.MARK_ALL_READ, {});
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnread(0);
        } catch (e) {
            console.error('Failed to mark all notifications read:', e);
        }
    };

    if (!isLoggedIn()) return null;

    const categoryIcon = {
        booking: '🏨',
        payment: '💳',
        general: '🔔',
    };

    return (
        <li className="nav-item" style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                title="Notifications"
                aria-label="Notifications"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '1.3rem', color: '#ffffff', position: 'relative',
                    padding: '0.3rem 0.5rem', lineHeight: 1,
                }}
            >
                🔔
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: '-2px', right: '-4px',
                        background: '#ef4444', color: '#fff', borderRadius: '50%',
                        fontSize: '0.65rem', minWidth: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', fontWeight: 700,
                    }}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '340px', maxWidth: '85vw', background: '#ffffff',
                    borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    zIndex: 1000, color: '#1f2937', overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderBottom: '1px solid #e5e7eb',
                        background: '#f8fafc',
                    }}>
                        <strong style={{ fontSize: '0.95rem' }}>Notifications</strong>
                        {unread > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'none', border: 'none', color: '#2563eb',
                                    fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleClickNotification(notification)}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        width: '100%', textAlign: 'left', padding: '11px 14px',
                                        border: 'none', borderBottom: '1px solid #f1f5f9',
                                        background: notification.is_read ? '#ffffff' : '#eff6ff',
                                        cursor: 'pointer', fontSize: '0.85rem', color: '#1f2937',
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                                        {categoryIcon[notification.category] || categoryIcon.general}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ display: 'block', fontWeight: 600, marginBottom: '2px' }}>
                                            {notification.title}
                                        </span>
                                        <span style={{ display: 'block', color: '#475569', lineHeight: 1.35 }}>
                                            {notification.message}
                                        </span>
                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem', marginTop: '4px' }}>
                                            {notification.time_ago}
                                        </span>
                                    </span>
                                    {!notification.is_read && (
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: '#2563eb', flexShrink: 0, marginTop: '4px',
                                        }} />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </li>
    );
};

export default NotificationBell;