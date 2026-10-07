from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth import get_user_model


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


def _hostel_caretaker(hostel):
    """Return the caretaker user linked to a hostel, if any."""
    if not hostel:
        return None
    if getattr(hostel, 'admin_user', None):
        return hostel.admin_user
    if hostel.caretaker_phone:
        User = get_user_model()
        try:
            return User.objects.get(phone=hostel.caretaker_phone)
        except User.DoesNotExist:
            return None
    return None


def send_caretaker_new_booking_email(reservation):
    """Notify the hostel caretaker (by email) about a new booking."""
    caretaker = _hostel_caretaker(reservation.hostel)
    recipient = caretaker.email if caretaker else None
    if not recipient:
        return False

    user = reservation.user
    subject = f"New Booking - {reservation.hostel.name} ({reservation.reservation_code})"

    text_content = (
        f"Hello {caretaker.name},\n\n"
        f"A student has submitted a new booking at {reservation.hostel.name}.\n\n"
        f"Booking Details:\n"
        f"  Reservation Code: {reservation.reservation_code}\n"
        f"  Student: {user.name}\n"
        f"  Student Phone: {user.phone}\n"
        f"  Student Email: {user.email}\n"
        f"  Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n"
        f"  Check-in: {reservation.check_in_date}\n"
        f"  Amount: UGX {reservation.total_amount:,.0f}\n"
        f"  Status: Pending review\n\n"
        f"Please log in to review and confirm this booking.\n\n"
        f"Best regards,\n"
        f"BU Hostels Management"
    )

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">New Booking Alert</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hello <strong>{caretaker.name}</strong>,</p>
            <p>A student has submitted a new booking at <strong>{reservation.hostel.name}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Reservation Code</strong></td><td style="padding: 8px;">{reservation.reservation_code}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Student</strong></td><td style="padding: 8px;">{user.name}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Student Phone</strong></td><td style="padding: 8px;">{user.phone}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Student Email</strong></td><td style="padding: 8px;">{user.email}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Room</strong></td><td style="padding: 8px;">{reservation.room.room_number if reservation.room else 'Not assigned'}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Check-in</strong></td><td style="padding: 8px;">{reservation.check_in_date}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Amount</strong></td><td style="padding: 8px;">UGX {reservation.total_amount:,.0f}</td></tr>
                <tr><td style="padding: 8px; background: #eff6ff;"><strong>Status</strong></td><td style="padding: 8px; color: #2563eb; font-weight: bold;">Pending review</td></tr>
            </table>
            <p>Please log in to review and confirm this booking.</p>
            <p>Best regards,<br>BU Hostels Management</p>
        </div>
    </body>
    </html>
    """
    return _send_html_email(subject, recipient, text_content, html_content)


def send_caretaker_booking_cancelled_email(reservation):
    """Notify the hostel caretaker (by email) that a booking was cancelled."""
    caretaker = _hostel_caretaker(reservation.hostel)
    recipient = caretaker.email if caretaker else None
    if not recipient:
        return False

    user = reservation.user
    amount = f"{reservation.amount_paid:,.0f}" if reservation.amount_paid else "0"
    subject = f"Booking Cancelled - {reservation.hostel.name} ({reservation.reservation_code})"

    text_content = (
        f"Hello {caretaker.name},\n\n"
        f"A booking at {reservation.hostel.name} has been CANCELLED.\n\n"
        f"Booking Details:\n"
        f"  Reservation Code: {reservation.reservation_code}\n"
        f"  Student: {user.name}\n"
        f"  Student Phone: {user.phone}\n"
        f"  Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n\n"
        f"Action Required:\n"
        f"Please refund UGX {amount} to {user.name} ({user.phone}) as applicable.\n\n"
        f"If you have any questions, contact the administration.\n\n"
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
            <p>Hello <strong>{caretaker.name}</strong>,</p>
            <p>A booking at <strong>{reservation.hostel.name}</strong> has been <strong style="color: #dc2626;">CANCELLED</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Reservation Code</strong></td><td style="padding: 8px;">{reservation.reservation_code}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Student</strong></td><td style="padding: 8px;">{user.name}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Student Phone</strong></td><td style="padding: 8px;">{user.phone}</td></tr>
                <tr><td style="padding: 8px; background: #f8fafc;"><strong>Room</strong></td><td style="padding: 8px;">{reservation.room.room_number if reservation.room else 'Not assigned'}</td></tr>
            </table>
            <p><strong>Action required:</strong> Please refund <strong>UGX {amount}</strong> to {user.name} ({user.phone}) as applicable.</p>
            <p>If you have any questions, contact the administration.</p>
            <p>Best regards,<br>BU Hostels Management</p>
        </div>
    </body>
    </html>
    """
    return _send_html_email(subject, recipient, text_content, html_content)


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
