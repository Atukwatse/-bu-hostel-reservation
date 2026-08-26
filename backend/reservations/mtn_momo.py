"""
MTN MoMo Collection API Integration (Sandbox + Production).

Flow:
  1. Get access token (cached for its lifetime)
  2. Request to Pay -> sends real prompt to user's phone
  3. Poll Get Request to Pay -> check if user approved/rejected

Requires these settings in settings.py / .env:
  MTN_MOMO_ENV          - 'sandbox' or 'production'
  MTN_MOMO_API_USER     - API user ID (UUID)
  MTN_MOMO_API_KEY      - API key for that user
  MTN_MOMO_SUBSCRIPTION_KEY - Ocp-Apim-Subscription-Key
  MTN_MOMO_CALLBACK_URL - (optional) webhook URL for async notifications
"""

import uuid
import time
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────

_mtn_env = getattr(settings, 'MTN_MOMO_ENV', 'sandbox')
_mtn_api_user = getattr(settings, 'MTN_MOMO_API_USER', '')
_mtn_api_key = getattr(settings, 'MTN_MOMO_API_KEY', '')
_mtn_sub_key = getattr(settings, 'MTN_MOMO_SUBSCRIPTION_KEY', '')
_mtn_callback_url = getattr(settings, 'MTN_MOMO_CALLBACK_URL', '')

# URLs per environment
_BASE_URLS = {
    'sandbox': 'https://sandbox.momodeveloper.mtn.com',
    'production': 'https://proxy.momoapi.mtn.com',
}
BASE_URL = _BASE_URLS.get(_mtn_env, _BASE_URLS['sandbox'])

# Currency and target environment
CURRENCY = 'UGX'
TARGET_ENV = 'sandbox' if _mtn_env == 'sandbox' else 'mtnuganda'

# Token cache
_token_cache = {'token': None, 'expires_at': 0}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _new_ref_id():
    """Generate a fresh UUID v4 for MTN X-Reference-Id."""
    return str(uuid.uuid4())


def _auth_header():
    """Basic auth header: base64(apiuser:apikey) -> just use requests auth."""
    import base64
    cred = base64.b64encode(f'{_mtn_api_user}:{_mtn_api_key}'.encode()).decode()
    return f'Basic {cred}'


def _common_headers():
    """Headers required on every MTN API call."""
    return {
        'Ocp-Apim-Subscription-Key': _mtn_sub_key,
        'X-Target-Environment': TARGET_ENV,
    }


# ── Step 1: Access Token ────────────────────────────────────────────────────

def get_access_token():
    """
    Get or refresh an access token from MTN.
    Tokens typically live 3600 seconds; we cache with a 60s safety margin.
    """
    now = time.time()
    if _token_cache['token'] and now < _token_cache['expires_at']:
        return _token_cache['token']

    url = f'{BASE_URL}/collection/token/'
    headers = _common_headers()

    try:
        resp = requests.post(
            url,
            headers=headers,
            auth=(_mtn_api_user, _mtn_api_key),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get('access_token')
        expires_in = data.get('expires_in', 3600)

        _token_cache['token'] = token
        _token_cache['expires_at'] = now + expires_in - 60  # 60s buffer

        logger.info('[MTN] Access token obtained, expires in %ss', expires_in)
        return token
    except Exception as e:
        logger.error('[MTN] Failed to get access token: %s', e)
        return None


# ── Step 2: Request to Pay ──────────────────────────────────────────────────

def request_to_pay(phone, amount, external_id=None, payer_message='Pay for hostel booking', payee_note='Hostel reservation payment'):
    """
    Send a real payment prompt to the user's MTN MoMo phone.

    Args:
        phone: MSISDN in international format, e.g. '256781234567'
        amount: string amount, e.g. '375000'
        external_id: your internal reference (optional)
        payer_message: shown on user's phone prompt
        payee_note: note for the payee (you)

    Returns:
        dict with 'reference_id' (poll this) and 'status' (SUCCESS/FAILED)
        or dict with 'error' on failure.
    """
    token = get_access_token()
    if not token:
        return {'error': 'Could not obtain MTN access token. Check your API credentials.'}

    reference_id = _new_ref_id()
    url = f'{BASE_URL}/collection/v1_0/requesttopay'
    headers = {
        **_common_headers(),
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'X-Reference-Id': reference_id,
        'X-Callback-Url': _mtn_callback_url,
    }

    body = {
        'amount': str(amount),
        'currency': CURRENCY,
        'externalId': external_id or reference_id,
        'payer': {
            'partyIdType': 'MSISDN',
            'partyId': phone,
        },
        'payerMessage': payer_message,
        'payeeNote': payee_note,
    }

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=30)
        # MTN returns 202 Accepted when the prompt is sent successfully
        if resp.status_code in (200, 201, 202):
            logger.info('[MTN] RequestToPay sent to %s, ref=%s', phone, reference_id)
            return {'reference_id': reference_id, 'status': 'PENDING'}

        # Error handling
        error_data = {}
        try:
            error_data = resp.json()
        except Exception:
            pass
        logger.error('[MTN] RequestToPay failed (%s): %s', resp.status_code, error_data)
        return {
            'error': error_data.get('message', f'MTN API returned HTTP {resp.status_code}'),
            'status_code': resp.status_code,
        }
    except Exception as e:
        logger.error('[MTN] RequestToPay exception: %s', e)
        return {'error': str(e)}


# ── Step 3: Check Payment Status ────────────────────────────────────────────

def get_request_to_pay_status(reference_id):
    """
    Poll the status of a previously initiated RequestToPay.

    Returns:
        dict with keys: status, amount, currency, externalId,
        reason (if failed), payer (MSISDN), etc.
    """
    token = get_access_token()
    if not token:
        return {'error': 'Could not obtain MTN access token.'}

    url = f'{BASE_URL}/collection/v1_0/requesttopay/{reference_id}'
    headers = {
        **_common_headers(),
        'Authorization': f'Bearer {token}',
    }

    try:
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            return {
                'status': data.get('status', 'UNKNOWN'),
                'amount': data.get('amount'),
                'currency': data.get('currency'),
                'externalId': data.get('externalId'),
                'reason': data.get('reason'),
                'payer': data.get('payer', {}),
                'financialTransactionId': data.get('financialTransactionId'),
            }
        elif resp.status_code == 404:
            return {'status': 'NOT_FOUND'}
        else:
            logger.error('[MTN] GetRequestToPay failed (%s): %s', resp.status_code, resp.text)
            return {'error': f'HTTP {resp.status_code}', 'status': 'ERROR'}
    except Exception as e:
        logger.error('[MTN] GetRequestToPay exception: %s', e)
        return {'error': str(e), 'status': 'ERROR'}
