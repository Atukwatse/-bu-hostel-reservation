import africastalking
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Africa's Talking SMS
_username = getattr(settings, 'AFRICASTALKING_USERNAME', 'sandbox')
_api_key = getattr(settings, 'AFRICASTALKING_API_KEY', '')

africastalking.initialize(username=_username, api_key=_api_key)
sms = africastalking.SMS

# WhatsApp API config
WHATSAPP_API_URL = 'https://api.africastalking.com/version1/whatsapp/messages/send'
WHATSAPP_SENDER_ID = '256000'  # Africa's Talking WhatsApp sender


def _format_uganda_phone(phone, country_code=None):
    """
    Format a Ugandan phone number to international format (+256XXXXXXXXX).

    Handles these input formats:
      - '2567XXXXXXXX'  -> '+2567XXXXXXXX'  (already has country digits, no +)
      - '07XXXXXXXX'    -> '+2567XXXXXXXX'  (local format)
      - '7XXXXXXXX'     -> '+2567XXXXXXXX'  (bare digits)
      - '+2567XXXXXXXX' -> '+2567XXXXXXXX'  (already correct)
    """
    if not phone:
        return None

    phone = str(phone).strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

    if phone.startswith('+'):
        return phone

    if phone.startswith('0') and len(phone) == 10:
        phone = '256' + phone[1:]

    if phone.startswith('256') and len(phone) == 12:
        return '+' + phone

    if len(phone) == 9 and phone.startswith('7'):
        return '+256' + phone

    if country_code:
        return country_code + phone

    return '+256' + phone


def send_sms_message(phone_number, message):
    """Send an SMS via Africa's Talking."""
    formatted = _format_uganda_phone(phone_number)
    if not formatted:
        logger.warning("[SMS] No phone number provided, skipping SMS")
        return False

    if not _api_key or _api_key == 'your_api_key_here':
        logger.info(f"[SMS] (sandbox mode) To: {formatted} | Message: {message}")
        return True

    try:
        response = sms.send(message=message, recipients=[formatted])
        recipients = response.get('SMSMessageData', {}).get('Recipients', [])
        for r in recipients:
            if r.get('status') == 'Success':
                logger.info(f"[SMS] Sent to {formatted}")
                return True
            else:
                logger.error(f"[SMS] Failed to {formatted}: {r.get('status')}")
        return False
    except Exception as e:
        logger.error(f"[SMS] Error sending to {formatted}: {e}")
        return False


def send_whatsapp_message(phone_number, message):
    """Send a WhatsApp message via Africa's Talking HTTP API."""
    formatted = _format_uganda_phone(phone_number)
    if not formatted:
        logger.warning("[WhatsApp] No phone number provided, skipping WhatsApp")
        return False

    if not _api_key or _api_key == 'your_api_key_here':
        logger.info(f"[WhatsApp] (sandbox mode) To: {formatted} | Message: {message}")
        return True

    try:
        headers = {
            'ApiKey': _api_key,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        payload = {
            'username': _username,
            'to': formatted,
            'message': message,
        }
        resp = requests.post(WHATSAPP_API_URL, headers=headers, data=payload, timeout=30)
        data = resp.json()

        recipients = data.get('SMSMessageData', {}).get('Recipients', [])
        for r in recipients:
            if r.get('status') == 'Success':
                logger.info(f"[WhatsApp] Sent to {formatted}")
                return True
            else:
                logger.error(f"[WhatsApp] Failed to {formatted}: {r.get('status')}")
        return False
    except Exception as e:
        logger.error(f"[WhatsApp] Error sending to {formatted}: {e}")
        return False


def send_user_cancellation_notifications(reservation):
    """Send SMS + WhatsApp to the user whose booking was cancelled."""
    user = reservation.user
    phone = user.phone

    amount = f"{reservation.amount_paid:,.0f}" if reservation.amount_paid else "0"
    payment_method_display = {
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Bank Transfer',
        'cash': 'Cash',
        'upload_receipt': 'Receipt Upload',
    }.get(reservation.payment_method, reservation.payment_method or 'N/A')

    message = (
        f"Dear {user.first_name or 'Student'},\n\n"
        f"Your booking at {reservation.hostel.name} "
        f"(Code: {reservation.reservation_code}) has been CANCELLED.\n\n"
        f"Refund Details:\n"
        f"Amount: UGX {amount}\n"
        f"Method: {payment_method_display}\n"
        f"Your refund will be processed within 24 hours.\n\n"
        f"For queries, contact the administration.\n\n"
        f"- BU Hostel Management"
    )

    sms_ok = send_sms_message(phone, message)
    whatsapp_ok = send_whatsapp_message(phone, message)

    return {'sms': sms_ok, 'whatsapp': whatsapp_ok}


def send_caretaker_cancellation_notifications(reservation):
    """Send SMS + WhatsApp to the caretaker of the hostel."""
    hostel = reservation.hostel
    caretaker_phone = hostel.caretaker_phone
    user = reservation.user

    amount = f"{reservation.amount_paid:,.0f}" if reservation.amount_paid else "0"

    message = (
        f"Hello,\n\n"
        f"Booking CANCELLED at {hostel.name}.\n\n"
        f"Booking Details:\n"
        f"Code: {reservation.reservation_code}\n"
        f"Student: {user.name}\n"
        f"Student Phone: {user.phone}\n"
        f"Room: {reservation.room.room_number if reservation.room else 'Not assigned'}\n\n"
        f"Action Required:\n"
        f"Refund UGX {amount} to {user.name} ({user.phone}) "
        f"within 24 hours.\n\n"
        f"- BU Hostel Management"
    )

    sms_ok = send_sms_message(caretaker_phone, message)
    whatsapp_ok = send_whatsapp_message(caretaker_phone, message)

    return {'sms': sms_ok, 'whatsapp': whatsapp_ok}
