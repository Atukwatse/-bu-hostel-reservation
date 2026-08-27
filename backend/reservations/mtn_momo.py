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

# URLs per environment
_BASE_URLS = {
    'sandbox': 'https://sandbox.momodeveloper.mtn.com',
    'production': 'https://proxy.momoapi.mtn.com',
}

CURRENCY = 'UGX'

# Token cache
_token_cache = {'token': None, 'expires_at': 0}


# ── Configuration helpers ────────────────────────────────────────────────────

def _config():
    """Read MTN settings freshly so env changes are picked up without restart."""
    env = (getattr(settings, 'MTN_MOMO_ENV', '') or 'sandbox').strip().lower()
    if env not in _BASE_URLS:
        env = 'sandbox'
    return {
        'env': env,
        'base_url': _BASE_URLS[env],
        'api_user': (getattr(settings, 'MTN_MOMO_API_USER', '') or '').strip(),
        'api_key': (getattr(settings, 'MTN_MOMO_API_KEY', '') or '').strip(),
        'sub_key': (getattr(settings, 'MTN_MOMO_SUBSCRIPTION_KEY', '') or '').strip(),
        'callback_url': (getattr(settings, 'MTN_MOMO_CALLBACK_URL', '') or '').strip(),
        'target_env': 'sandbox' if env == 'sandbox' else 'mtnuganda',
    }


def _new_ref_id():
    """Generate a fresh UUID v4 for MTN X-Reference-Id."""
    return str(uuid.uuid4())


def _common_headers(cfg):
    """Headers required on every MTN API call."""
    return {
        'Ocp-Apim-Subscription-Key': cfg['sub_key'],
        'X-Target-Environment': cfg['target_env'],
    }


# ── Step 1: Access Token ────────────────────────────────────────────────────

def get_access_token(retries=3):
    """
    Get or refresh an access token from MTN.
    Retries transient sandbox failures.
    """
    now = time.time()
    if _token_cache['token'] and now < _token_cache['expires_at']:
        return _token_cache['token']

    cfg = _config()

    if not cfg['api_user'] or not cfg['api_key'] or not cfg['sub_key']:
        logger.error(
            '[MTN] Missing API credentials. Check MTN_MOMO_* settings in your .env file.'
        )
        return None

    url = f"{cfg['base_url']}/collection/token/"
    headers = _common_headers(cfg)

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(
                url,
                headers=headers,
                auth=(cfg['api_user'], cfg['api_key']),
                timeout=30,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                token = data.get('access_token')
                expires_in = data.get('expires_in', 3600)

                _token_cache['token'] = token
                _token_cache['expires_at'] = now + expires_in - 60  # 60s buffer

                logger.info('[MTN] Access token obtained, expires in %ss', expires_in)
                return token
            else:
                last_err = f'HTTP {resp.status_code}: {resp.text[:200]}'
                logger.warning('[MTN] Token request attempt %d failed (%s)', attempt, last_err)
        except Exception as e:
            last_err = str(e)
            logger.warning('[MTN] Token request attempt %d exception: %s', attempt, last_err)

        if attempt < retries:
            time.sleep(1)

    logger.error('[MTN] Failed to get access token after %d attempts: %s', retries, last_err)
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
    cfg = _config()
    token = get_access_token()
    if not token:
        return {'error': 'Could not obtain MTN access token. Check your API credentials.'}

    reference_id = _new_ref_id()
    url = f"{cfg['base_url']}/collection/v1_0/requesttopay"
    headers = {
        **_common_headers(cfg),
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'X-Reference-Id': reference_id,
        'X-Callback-Url': cfg['callback_url'],
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
            'error': error_data.get('message', f'MTN API returned HTTP {resp.status_code}: {resp.text[:200]}'),
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
    cfg = _config()
    token = get_access_token()
    if not token:
        return {'error': 'Could not obtain MTN access token.'}

    url = f"{cfg['base_url']}/collection/v1_0/requesttopay/{reference_id}"
    headers = {
        **_common_headers(cfg),
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
