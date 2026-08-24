"""
Mobile Money SMS parser for Ugandan providers (MTN MoMo, Airtel Money).
Extracts transaction ID, amount, phone numbers, date/time and provider
from a pasted confirmation message so payment details can be auto-filled.
"""
import re

CURRENCY = r'(?:UGX|Ugx|ugx|Ushs?|USH)'

MTN_TXN_RE = re.compile(r'\b(?:CP|MP|CV|MV|CB|RB)\d{6}\.\d{4}\.[A-Z]\d{4,6}\b', re.IGNORECASE)
AIRTEL_TXN_RE = re.compile(r'\b\d{10,12}(?:/PT\d{6}\.\d{4}\.[A-Z]\d{4,6})?\b')
LABELLED_TXN_RE = re.compile(
    r'(?:Transaction\s*ID|Trans(?:action)?\s*(?:ID|No|Number)|Txn\s*ID|'
    r'Ref(?:erence)?(?:\s*(?:No|Number))?\.?|Receipt(?:\s*(?:No|Number))?|ID)'
    r'\s*[:#=]?\s*([A-Za-z0-9][A-Za-z0-9\-\/\.]{3,40})',
    re.IGNORECASE,
)

AMOUNT_RE = re.compile(
    CURRENCY + r'\s*[:=]?\s*([\d,]+(?:\.\d{1,2})?)'      # UGX 150,000 / UGX150000
    r'|([\d,]+(?:\.\d{1,2})?)\s*' + CURRENCY              # 150,000 UGX
)

PHONE_RE = re.compile(
    r'(?:\+?256[\s\-]?)?(?:0?7\d)[\s\-]?\d{3}[\s\-]?\d{3,4}\b'
    r'|\+256\d{7,9}\b'
    r'|2567\d{7,8}\b'
)

DATETIME_RE = re.compile(
    r'\d{4}-\d{1,2}-\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?'
    r'|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}(?:[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap]\.?[Mm]\.?)?)?'
)

PROVIDERS = {
    'mtn': ['mtn', 'momo', 'mtm', 'm-sente', 'msente'],
    'airtel': ['airtel', 'airtel money'],
}

NEGATIVE_CONTEXTS = ['fee', 'balance', 'charges', 'tax']


def _to_number(raw):
    try:
        return float(raw.replace(',', ''))
    except (ValueError, AttributeError):
        return None


def _detect_provider(message):
    lowered = message.lower()
    if any(k in lowered for k in PROVIDERS['mtn']):
        return 'mtn'
    if any(k in lowered for k in PROVIDERS['airtel']):
        return 'airtel'
    # MTN style IDs start with CP/MP and contain dots
    if MTN_TXN_RE.search(message):
        return 'mtn'
    if AIRTEL_TXN_RE.search(message):
        return 'airtel'
    return 'unknown'


def _extract_transaction_id(message):
    mtn_match = MTN_TXN_RE.search(message)
    if mtn_match:
        return mtn_match.group(0).upper()

    labelled = LABELLED_TXN_RE.search(message)
    if labelled:
        candidate = labelled.group(1).strip('.,;:')
        # Avoid picking amounts or phone numbers as the ID
        if not candidate.replace(',', '').replace('.', '').isdigit() or len(candidate) >= 8:
            if not PHONE_RE.fullmatch(candidate):
                return candidate.upper()

    airtel_match = AIRTEL_TXN_RE.search(message)
    if airtel_match:
        return airtel_match.group(0).upper()

    return None


def _extract_amount(message):
    best_amount = None
    best_priority = -1
    for match in AMOUNT_RE.finditer(message):
        raw = match.group(1) or match.group(2)
        amount = _to_number(raw)
        if amount is None or amount <= 0:
            continue
        start = max(0, match.start() - 30)
        context = message[start:match.end() + 30].lower()
        priority = 0
        if any(word in context for word in NEGATIVE_CONTEXTS):
            priority = 0
        elif any(word in context for word in ['payment of', 'paid', 'received', 'sent', 'you have', 'deposited']):
            priority = 2
        else:
            priority = 1
        if priority > best_priority:
            best_priority = priority
            best_amount = amount
    return best_amount


def _extract_phone_numbers(message):
    phones = []
    for match in PHONE_RE.finditer(message):
        phone = re.sub(r'[\s\-]', '', match.group(0))
        if phone.startswith('+'):
            phone = phone[1:]
        if phone.startswith('256') and len(phone) == 12:
            local = '0' + phone[3:]
        elif len(phone) == 9:
            local = '0' + phone
        else:
            local = phone
        if local.startswith('07') and len(local) == 10 and local not in phones:
            phones.append(local)
    return phones


def _extract_datetime(message):
    match = DATETIME_RE.search(message)
    return match.group(0) if match else None


def _extract_status(message):
    lowered = message.lower()
    if any(w in lowered for w in ['failed', 'insufficient', 'declined', 'rejected']):
        return 'failed'
    if any(w in lowered for w in ['received', 'paid', 'completed', 'success', 'confirmed', 'deposit']):
        return 'success'
    if 'pending' in lowered:
        return 'pending'
    return 'unknown'


def parse_mobile_money_message(message):
    """Parse a mobile money SMS into structured payment details."""
    if not message or not str(message).strip():
        return None

    message = str(message).strip()

    return {
        'provider': _detect_provider(message),
        'transaction_id': _extract_transaction_id(message),
        'amount': _extract_amount(message),
        'currency': 'UGX',
        'phone_numbers': _extract_phone_numbers(message),
        'datetime': _extract_datetime(message),
        'status': _extract_status(message),
    }
