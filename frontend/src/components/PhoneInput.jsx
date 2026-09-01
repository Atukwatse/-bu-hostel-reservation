import React, { useState, useEffect, useRef } from 'react';

const flagUrl = (iso) => `https://flagcdn.com/w40/${iso}.png`;

const COUNTRIES = [
    { iso: 'ug', code: '+256', name: 'Uganda' },
    { iso: 'rw', code: '+250', name: 'Rwanda' },
    { iso: 'tz', code: '+255', name: 'Tanzania' },
    { iso: 'ke', code: '+254', name: 'Kenya' },
    { iso: 'ss', code: '+211', name: 'South Sudan' },
    { iso: 'bi', code: '+257', name: 'Burundi' },
    { iso: 'ng', code: '+234', name: 'Nigeria' },
    { iso: 'gh', code: '+233', name: 'Ghana' },
    { iso: 'ci', code: '+225', name: "Côte d'Ivoire" },
    { iso: 'bj', code: '+229', name: 'Benin' },
    { iso: 'za', code: '+27', name: 'South Africa' },
    { iso: 'zw', code: '+263', name: 'Zimbabwe' },
    { iso: 'zm', code: '+260', name: 'Zambia' },
    { iso: 'mw', code: '+265', name: 'Malawi' },
    { iso: 'us', code: '+1', name: 'United States' },
    { iso: 'gb', code: '+44', name: 'United Kingdom' },
    { iso: 'fr', code: '+33', name: 'France' },
    { iso: 'de', code: '+49', name: 'Germany' },
    { iso: 'in', code: '+91', name: 'India' },
    { iso: 'cn', code: '+86', name: 'China' },
];

const GROUPS = [
    { group: 'East Africa', codes: ['ug', 'rw', 'tz', 'ke', 'ss', 'bi'] },
    { group: 'West Africa', codes: ['ng', 'gh', 'ci', 'bj'] },
    { group: 'Southern Africa', codes: ['za', 'zw', 'zm', 'mw'] },
    { group: 'International', codes: ['us', 'gb', 'fr', 'de', 'in', 'cn'] },
];

const findCountry = (code) => COUNTRIES.find((c) => c.code === code) || null;

export const flagUrlFor = (code) => {
    const c = findCountry(code);
    return c ? flagUrl(c.iso) : '';
};

export const digitsOnly = (value) => (value || '').replace(/[^\d]/g, '');

export const isValidPhoneNumber = (number, countryCode) => {
    const n = digitsOnly(number);
    if (!n) return false;
    const dial = (countryCode || '').replace(/\D/g, '');
    const total = dial + n;
    const length = total.length;
    return length >= 9 && length <= 15;
};

const FlagSelect = ({ id, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = findCountry(value);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', width: '30%' }}>
            <button
                type="button"
                id={id}
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1',
                    borderRadius: '4px', background: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    height: '100%', color: '#1e293b', fontSize: '0.9rem',
                }}
            >
                {selected ? (
                    <>
                        <img src={flagUrl(selected.iso)} alt={selected.name} width="24" height="18" style={{ width: '24px', height: '18px', objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: '2px' }} />
                        <span>{selected.code}</span>
                    </>
                ) : (
                    <span style={{ color: '#94a3b8' }}>Country</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>▾</span>
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
                        background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: '260px', overflowY: 'auto',
                    }}
                >
                    {GROUPS.map((g) => (
                        <div key={g.group}>
                            <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', background: '#f8fafc', position: 'sticky', top: 0 }}>
                                {g.group}
                            </div>
                            {g.codes.map((iso) => {
                                const c = COUNTRIES.find((x) => x.iso === iso);
                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        onClick={() => { onChange({ target: { id, value: c.code } }); setOpen(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                                            padding: '0.5rem 0.75rem', background: value === c.code ? '#eff6ff' : '#fff',
                                            border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', color: '#1e293b',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = value === c.code ? '#eff6ff' : '#fff'; }}
                                    >
                                        <img src={flagUrl(iso)} alt={c.name} width="24" height="18" style={{ width: '24px', height: '18px', objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: '2px' }} />
                                        <span>{c.code}</span>
                                        <span style={{ color: '#64748b', marginLeft: 'auto', textAlign: 'right' }}>{c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const PhoneInput = ({
    id,
    value,
    onChange,
    countryCode,
    onCountryCodeChange,
    countryCodeId = id + 'CountryCode',
    placeholder = 'e.g. 712345678',
    style,
}) => {
    const handleNumberChange = (e) => {
        onChange({ ...e, target: { ...e.target, value: digitsOnly(e.target.value) } });
    };

    return (
        <div style={{ display: 'flex', gap: '10px', ...style }}>
            <FlagSelect id={countryCodeId} value={countryCode} onChange={onCountryCodeChange} />
            <input
                type="tel"
                id={id}
                value={value}
                onChange={handleNumberChange}
                placeholder={placeholder}
                required
                style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                    }
                }}
            />
        </div>
    );
};

export default PhoneInput;
