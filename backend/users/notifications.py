from .models import Notification


def notify_user(user, title, message, category='general', link='', reservation=None):
    """Create an in-app notification for a single user."""
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        category=category,
        link=link,
        reservation=reservation,
    )


def notify_caretaker(hostel, title, message, category='general', link='', reservation=None):
    """Create in-app notifications for the caretaker(s) of a hostel.

    Uses the hostel's linked admin user, falling back to the user whose
    phone number matches the hostel's caretaker_phone.
    """
    if not hostel:
        return []
    from .models import User

    recipients = []
    if getattr(hostel, 'admin_user', None):
        recipients.append(hostel.admin_user)
    if hostel.caretaker_phone:
        try:
            recipients.append(User.objects.get(phone=hostel.caretaker_phone))
        except User.DoesNotExist:
            pass

    seen = set()
    for user in recipients:
        if user and user.pk not in seen:
            seen.add(user.pk)
            notify_user(user, title, message, category, link, reservation)
    return list(seen)