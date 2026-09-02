from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def _send_html_email(subject, recipient, text_content, html_content):
    if not recipient:
        return False
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            to=[recipient],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send '{subject}' to {recipient}: {e}")
        return False


def send_booking_received_email(reservation):
    """Notify the student that their booking request has been received."""
    user = reservation.user
    recipient = user.email
    subject = f"Booking Received - {reservation.hostel.name} ({reservation.reservation_code})"

    text_content = (
        f"Hello {user.name},\n\n"
        f"Your booking request has been received.\n\n"
        f"Booking Details:\n"
        f"  Reservation Code: {reservation.reservation_code}\n"
        f"  Hostel: {reservation.hostel.name}\n"
        f"  Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n"
        f"  Semester: {reservation.semester} ({reservation.academic_year})\n"
        f"  Check-in: {reservation.check_in_date}\n"
        f"  Status: Pending review\n\n"
        f"Your booking is pending review. You will be notified once it is confirmed.\n\n"
        f"Best regards,\n"
        f"BU Hostels Management"
    )

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Booking Received</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>{user.name}</strong>,</p>
            <p>Your booking request has been <strong>received</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Reservation Code</strong></td><td style="padding: 8px;">{reservation.reservation_code}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Hostel</strong></td><td style="padding: 8px;">{reservation.hostel.name}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Room</strong></td><td style="padding: 8px;">{reservation.room.room_number if reservation.room else 'Not assigned'}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Semester</strong></td><td style="padding: 8px;">{reservation.semester} ({reservation.academic_year})</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Check-in</strong></td><td style="padding: 8px;">{reservation.check_in_date}</td></tr>
                <tr><td style="padding: 8px; background: #eff6ff;"><strong>Status</strong></td><td style="padding: 8px; color: #2563eb; font-weight: bold;">Pending review</td></tr>
            </table>
            <p>Your booking is pending review. You will be notified once it is confirmed.</p>
            <p>Best regards,<br>BU Hostels Management</p>
        </div>
    </body>
    </html>
    """
    return _send_html_email(subject, recipient, text_content, html_content)


def send_booking_confirmed_email(reservation):
    """Notify the student that their booking has been confirmed."""
    user = reservation.user
    recipient = user.email
    subject = f"Booking Confirmed - {reservation.hostel.name} ({reservation.reservation_code})"

    text_content = (
        f"Hello {user.name},\n\n"
        f"Good news! Your hostel booking has been CONFIRMED.\n\n"
        f"Booking Details:\n"
        f"  Reservation Code: {reservation.reservation_code}\n"
        f"  Hostel: {reservation.hostel.name}\n"
        f"  Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n"
        f"  Semester: {reservation.semester} ({reservation.academic_year})\n"
        f"  Check-in: {reservation.check_in_date}\n"
        f"  Status: Confirmed\n\n"
        f"Your room has been reserved for you. Welcome!\n\n"
        f"If you have any questions, contact the administration.\n\n"
        f"Best regards,\n"
        f"BU Hostels Management"
    )

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Booking Confirmed</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>{user.name}</strong>,</p>
            <p>Great news! Your hostel booking has been <strong style="color: #16a34a;">CONFIRMED</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Reservation Code</strong></td><td style="padding: 8px;">{reservation.reservation_code}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Hostel</strong></td><td style="padding: 8px;">{reservation.hostel.name}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Room</strong></td><td style="padding: 8px;">{reservation.room.room_number if reservation.room else 'Not assigned'}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Semester</strong></td><td style="padding: 8px;">{reservation.semester} ({reservation.academic_year})</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Check-in</strong></td><td style="padding: 8px;">{reservation.check_in_date}</td></tr>
                <tr><td style="padding: 8px; background: #dcfce7;"><strong>Status</strong></td><td style="padding: 8px; color: #16a34a; font-weight: bold;">Confirmed</td></tr>
            </table>
            <p>Your room has been reserved for you. Welcome!</p>
            <p>If you have any questions, contact the administration.</p>
            <p>Best regards,<br>BU Hostels Management</p>
        </div>
    </body>
    </html>
    """
    return _send_html_email(subject, recipient, text_content, html_content)


def send_cancellation_email(reservation):
    """Notify the student that their reservation has been cancelled."""
    user = reservation.user
    recipient = user.email

    if not recipient:
        return False

    subject = f"Booking Cancelled - {reservation.hostel.name} ({reservation.reservation_code})"

    text_content = (
        f"Hello {user.name},\n\n"
        f"Your hostel booking has been CANCELLED.\n\n"
        f"Booking Details:\n"
        f"  Reservation Code: {reservation.reservation_code}\n"
        f"  Hostel: {reservation.hostel.name}\n"
        f"  Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n"
        f"  Semester: {reservation.semester} ({reservation.academic_year})\n"
        f"  Check-in: {reservation.check_in_date}\n"
        f"  Status: Cancelled\n\n"
        f"No hostel is currently booked on your account. "
        f"If you still need accommodation, please log in and reserve a room again.\n\n"
        f"If you did not expect this cancellation, please contact the administration.\n\n"
        f"Best regards,\n"
        f"BU Hostels Management"
    )

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Booking Cancelled</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>{user.name}</strong>,</p>
            <p>Your hostel booking has been <strong style="color: #dc2626;">CANCELLED</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Reservation Code</strong></td><td style="padding: 8px;">{reservation.reservation_code}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Hostel</strong></td><td style="padding: 8px;">{reservation.hostel.name}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Room</strong></td><td style="padding: 8px;">{reservation.room.room_number if reservation.room else 'Not assigned'}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Semester</strong></td><td style="padding: 8px;">{reservation.semester} ({reservation.academic_year})</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Check-in</strong></td><td style="padding: 8px;">{reservation.check_in_date}</td></tr>
                <tr><td style="padding: 8px; background: #fee2e2;"><strong>Status</strong></td><td style="padding: 8px; color: #dc2626; font-weight: bold;">Cancelled</td></tr>
            </table>
            <p><strong>No hostel is currently booked on your account.</strong> If you still need accommodation, please log in and reserve a room again.</p>
            <p>If you did not expect this cancellation, please contact the administration.</p>
            <p>Best regards,<br>BU Hostels Management</p>
        </div>
    </body>
    </html>
    """

    return _send_html_email(subject, recipient, text_content, html_content)
