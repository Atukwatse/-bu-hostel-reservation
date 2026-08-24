/** Consistent display name from API user objects (DRF UserSerializer shape). */
export function displayUserName(user) {
    if (!user) return '';
    const joined = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return (
        user.full_name ||
        user.name ||
        joined ||
        user.username ||
        user.email ||
        ''
    );
}
