#!/usr/bin/env python3
"""File-evidence grader for PORTAL-ACTIVATE-001.

Grades customer activation browser acceptance.
Synthetic fixtures are strictly for test suite verification and never attest live UI.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import random
import re
import struct
import subprocess
import sys
import tempfile
import time
import zlib

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent
MIN_GAP_S = 20
KONG = "dcentervn-local-api-gateway-1"
KONG_FAMILIES = ("JOURNEY-", "TOKEN-", "RESEND-", "RATE-LIMIT-", "SERVICE-BUSY-", "CSRF-", "STAFF-", "CONCURRENT-")
KONG_LINE = re.compile(r'\[(\d\d/\w{3}/\d{4}:\d\d:\d\d:\d\d [+-]\d{4})\] "[A-Z]+ (\S+) [^"]*" (\d{3}) \S+ "[^"]*" "([^"]*)"')

CELLS = [
    {
        "id": "UI-OPEN-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "zeroPostOnMount": 1,
            "locationSearchEmpty": 1,
            "noReferrerMeta": 1,
            "passwordFieldVisible": 1,
            "confirmFieldVisible": 1,
            "submitButtonVisible": 1,
            "minTargetPx": {"min": 44},
            "keyboardChecks": 7,
            "axeSerious": 0,
            "axeCritical": 0,
            "minContrast": {"min": 4.5},
            "horizontalOverflow": 0,
        },
        "expected": "PASS",
        "record": "UI-OPEN-desktop.json",
        "screenshot": "shots/UI-OPEN-desktop.png",
    },
    {
        "id": "UI-OPEN-mobile",
        "route": "/activate",
        "viewport": "mobile",
        "size": [390, 844],
        "criteria": {
            "zeroPostOnMount": 1,
            "locationSearchEmpty": 1,
            "noReferrerMeta": 1,
            "passwordFieldVisible": 1,
            "confirmFieldVisible": 1,
            "submitButtonVisible": 1,
            "minTargetPx": {"min": 44},
            "keyboardChecks": 7,
            "axeSerious": 0,
            "axeCritical": 0,
            "minContrast": {"min": 4.5},
            "horizontalOverflow": 0,
        },
        "expected": "PASS",
        "record": "UI-OPEN-mobile.json",
        "screenshot": "shots/UI-OPEN-mobile.png",
    },
    {
        "id": "UI-TOGGLE-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "passwordToggleOperable": 1,
            "confirmToggleOperable": 1,
            "toggleSubmitsForm": 0,
            "toggleHasAccessibleName": 1,
            "zeroPost": 1,
        },
        "expected": "PASS",
        "record": "UI-TOGGLE-desktop.json",
        "screenshot": "shots/UI-TOGGLE-desktop.png",
    },
    {
        "id": "VAL-SHORT-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "clientRejected": 1,
            "zeroPost": 1,
            "passwordFocused": 1,
            "errorMessageVisible": 1,
        },
        "expected": "PASS",
        "record": "VAL-SHORT-desktop.json",
        "screenshot": "shots/VAL-SHORT-desktop.png",
    },
    {
        "id": "VAL-MISMATCH-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "clientRejected": 1,
            "zeroPost": 1,
            "confirmFocused": 1,
            "mismatchMessageVisible": 1,
        },
        "expected": "PASS",
        "record": "VAL-MISMATCH-desktop.json",
        "screenshot": "shots/VAL-MISMATCH-desktop.png",
    },
    {
        "id": "VAL-TOOLONG-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "policyRejected": 1,
            "zeroPost": 1,
            "passwordFocused": 1,
        },
        "expected": "PASS",
        "record": "VAL-TOOLONG-desktop.json",
        "screenshot": "shots/VAL-TOOLONG-desktop.png",
    },
    {
        "id": "JOURNEY-SUCCESS-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 200,
            "postsSent": 1,
            "successMessageVisible": 1,
            "loginLinkVisible": 1,
            "newCookies": 0,
            "tokenClearedFromMemory": 1,
        },
        "expected": "PASS",
        "record": "JOURNEY-SUCCESS-desktop.json",
        "screenshot": "shots/JOURNEY-SUCCESS-desktop.png",
    },
    {
        "id": "JOURNEY-LOGIN-OWNER-desktop",
        "route": "/login",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "attackerLoginStatus": 401,
            "ownerLoginStatus": 200,
            "storeLanding": 1,
        },
        "expected": "PASS",
        "record": "JOURNEY-LOGIN-OWNER-desktop.json",
        "screenshot": "shots/JOURNEY-LOGIN-OWNER-desktop.png",
    },
    {
        "id": "CONCURRENT-SUBMIT-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "maxConcurrentRequests": {"max": 1},
            "ariaBusyAnnounced": 1,
            "submitDisabledWhilePending": 1,
        },
        "expected": "PASS",
        "record": "CONCURRENT-SUBMIT-desktop.json",
        "screenshot": "shots/CONCURRENT-SUBMIT-desktop.png",
    },
    {
        "id": "TOKEN-CONSUMED-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 400,
            "invalidTokenMessage": 1,
            "resendAvailable": 1,
            "fixedLoginLink": 1,
            "newCookies": 0,
        },
        "expected": "PASS",
        "record": "TOKEN-CONSUMED-desktop.json",
        "screenshot": "shots/TOKEN-CONSUMED-desktop.png",
    },
    {
        "id": "TOKEN-EXPIRED-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 400,
            "invalidTokenMessage": 1,
            "resendAvailable": 1,
            "fixedLoginLink": 1,
            "newCookies": 0,
        },
        "expected": "PASS",
        "record": "TOKEN-EXPIRED-desktop.json",
        "screenshot": "shots/TOKEN-EXPIRED-desktop.png",
    },
    {
        "id": "TOKEN-WRONG-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 400,
            "invalidTokenMessage": 1,
            "resendAvailable": 1,
            "fixedLoginLink": 1,
            "newCookies": 0,
        },
        "expected": "PASS",
        "record": "TOKEN-WRONG-desktop.json",
        "screenshot": "shots/TOKEN-WRONG-desktop.png",
    },
    {
        "id": "RESEND-REQUEST-desktop",
        "route": "/api/auth/activate/resend",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 202,
            "neutralAcceptedMessage": 1,
            "tokenExcludedFromBody": 1,
        },
        "expected": "PASS",
        "record": "RESEND-REQUEST-desktop.json",
        "screenshot": "shots/RESEND-REQUEST-desktop.png",
    },
    {
        "id": "RATE-LIMIT-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 429,
            "rateLimitMessage": 1,
            "retryCooldownSeconds": {"min": 1},
            "submitDisabledDuringCooldown": 1,
        },
        "expected": "PASS",
        "record": "RATE-LIMIT-desktop.json",
        "screenshot": "shots/RATE-LIMIT-desktop.png",
    },
    {
        "id": "SERVICE-BUSY-desktop",
        "route": "/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 503,
            "formRetained": 1,
            "manualRetryAllowed": 1,
        },
        "expected": "PASS",
        "record": "SERVICE-BUSY-desktop.json",
        "screenshot": "shots/SERVICE-BUSY-desktop.png",
    },
    {
        "id": "CSRF-CROSS-ORIGIN-desktop",
        "route": "/api/auth/activate",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "httpStatus": 403,
            "forbiddenCode": 1,
            "invalidRequestMessage": 1,
            "newCookies": 0,
        },
        "expected": "PASS",
        "record": "CSRF-CROSS-ORIGIN-desktop.json",
        "screenshot": "shots/CSRF-CROSS-ORIGIN-desktop.png",
    },
    {
        "id": "STAFF-INVITE-INDEPENDENT-desktop",
        "route": "/staff/invite/accept",
        "viewport": "desktop",
        "size": [1440, 900],
        "criteria": {
            "staffInviteRoute": 1,
            "customerRolesOnly": 1,
            "zeroCrossGrant": 1,
        },
        "expected": "PASS",
        "record": "STAFF-INVITE-INDEPENDENT-desktop.json",
        "screenshot": "shots/STAFF-INVITE-INDEPENDENT-desktop.png",
    },
]


def kong_entries(text):
    return [(datetime.strptime(m[1], '%d/%b/%Y:%H:%M:%S %z').timestamp(), m[2], int(m[3]), m[4])
            for m in KONG_LINE.finditer(text)]


def scripted(entry):
    _, path, _, ua = entry
    return not (ua in ('node', 'portal-bff') or ua.startswith(('Mozilla/', 'portal-bff/'))
                or (ua.startswith('curl/') and path in ('/status', '/metrics')))


def live_kong(start, end):
    return subprocess.run(
        ['docker', 'logs', '--since', str(int(start) - 1), '--until', str(int(end) + 2), KONG],
        capture_output=True, text=True, check=True, timeout=60,
    ).stdout


def stamp(value):
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None:
        raise ValueError('timestamp needs timezone')
    return parsed.timestamp()


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def read_json(path):
    def unique(pairs):
        data = {}
        for key, value in pairs:
            if key in data:
                raise ValueError('duplicate JSON key')
            data[key] = value
        return data
    if path.is_symlink():
        raise ValueError('symlink evidence')
    raw = path.read_text()
    if 'raw_secret_token_' in raw or 'unredacted_password_' in raw:
        raise ValueError('secret data detected in evidence record')
    return json.loads(raw, object_pairs_hook=unique)


def check_metrics(record, cell):
    metrics = record.get('measurements')
    if not isinstance(metrics, dict):
        raise ValueError('measurements missing or not object')
    for name, expected in cell['criteria'].items():
        if name not in metrics:
            raise ValueError(f'measurement {name} missing')
        value = metrics[name]
        if not numeric(value) or value < 0:
            raise ValueError(f'measurement {name} missing/invalid')
        if isinstance(expected, dict):
            ok = value >= expected['min'] if 'min' in expected else value <= expected['max']
        else:
            ok = value == expected
        if not ok:
            raise ValueError(f'measurement {name} threshold failed: got {value}, expected {expected}')


def check_png(path, size):
    if path.is_symlink():
        raise ValueError('symlink screenshot')
    image = path.read_bytes()
    if image[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not PNG')
    offset, payload, ended, dimensions = 8, b'', False, None
    while offset < len(image):
        length = struct.unpack('>I', image[offset:offset + 4])[0]
        name = image[offset + 4:offset + 8]
        data = image[offset + 8:offset + 8 + length]
        crc = struct.unpack('>I', image[offset + 8 + length:offset + 12 + length])[0]
        if zlib.crc32(name + data) != crc:
            raise ValueError('PNG CRC invalid')
        if offset == 8 and name != b'IHDR':
            raise ValueError('PNG IHDR missing')
        if name == b'IHDR':
            w, h, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', data)
            if dimensions or [w, h] != size or depth != 8 or color not in (0, 2, 6) or any((compression, filtering, interlace)):
                raise ValueError('wrong viewport PNG or unsupported encoding')
            dimensions = (w, h, {0: 1, 2: 3, 6: 4}[color])
        if name == b'IDAT':
            payload += data
        offset += length + 12
        if name == b'IEND':
            ended = True
            break
    if not ended or offset != len(image) or not dimensions:
        raise ValueError('incomplete PNG')
    w, h, channels = dimensions
    decoded = zlib.decompress(payload)
    if len(decoded) != h * (1 + w * channels):
        raise ValueError('PNG pixel data invalid')
    return hashlib.sha256(image).hexdigest()


def grade(out, kong_text=None, is_synthetic=False):
    results, seen_hashes, times, records = [], {}, {}, {}
    try:
        if not out.exists() or not out.is_dir():
            raise ValueError('evidence directory missing or not directory')
        if out.is_symlink() or (out / 'shots').is_symlink():
            raise ValueError('symlink evidence directory')
        if not (out / 'run.json').exists():
            raise ValueError('run.json missing')
        run = read_json(out / 'run.json')
        if run.get('end') is None:
            raise ValueError('run incomplete')
        start, end = stamp(run['start']), stamp(run['end'])
        if start > end or not isinstance(run.get('runId'), str) or not run['runId'] or run.get('tester') != 'Anti':
            raise ValueError('invalid run window/identity')
        if run.get('exit_code') != 0:
            raise ValueError('runner exit_code not zero')
        if run['runId'] == 'synthetic-run' and not is_synthetic:
            raise ValueError('synthetic fixture cannot be submitted as live acceptance run')
        before = (out / 'tracked-before.diff').read_bytes() if (out / 'tracked-before.diff').exists() else b''
        after = (out / 'tracked-after.diff').read_bytes() if (out / 'tracked-after.diff').exists() else b''
        if not before or before != after:
            raise ValueError('tracked diff changed or missing')
        expected_json = {'run.json'} | {c['record'] for c in CELLS}
        actual_json = {p.name for p in out.glob('*.json')}
        if actual_json != expected_json:
            raise ValueError(f'JSON records mismatch: missing={expected_json - actual_json}, extra={actual_json - expected_json}')
        expected_shots = {Path(c['screenshot']).name for c in CELLS}
        actual_shots = {p.name for p in (out / 'shots').glob('*')}
        if actual_shots != expected_shots:
            raise ValueError(f'screenshots mismatch: missing={expected_shots - actual_shots}, extra={actual_shots - expected_shots}')
        if kong_text is not None:
            raw_kong = kong_text
        elif (out / 'kong-access.log').exists() and (out / 'kong-access.log').stat().st_size > 0:
            raw_kong = (out / 'kong-access.log').read_text()
        else:
            raw_kong = live_kong(start, end)
        kong = kong_entries(raw_kong)
        if any(scripted(e) for e in kong):
            clients = ', '.join(sorted({e[3] for e in kong if scripted(e)}))
            raise ValueError(f'non-browser client called Kong during run: {clients}')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError) as exc:
        return [(c['id'], 'FAIL', f'run: {exc}') for c in CELLS]

    for cell in CELLS:
        state, reason = 'FAIL', ''
        try:
            record = read_json(out / cell['record'])
            records[cell['id']] = record
            for field in ('id', 'route', 'viewport', 'screenshot'):
                if record.get(field) != cell[field]:
                    raise ValueError(f'{field} mismatch')
            if record.get('runId') != run['runId']:
                raise ValueError('replayed runId')
            if not start <= stamp(record['fetchTime']) <= end:
                raise ValueError('fetchTime outside run window')
            times[cell['id']] = stamp(record['fetchTime'])
            digest = check_png(out / cell['screenshot'], cell['size'])
            if digest != record.get('screenshotSha256'):
                raise ValueError('screenshot digest mismatch')
            seen_hashes.setdefault(digest, []).append(cell['id'])
            state = record.get('verdict')
            if state not in ('PASS', 'FAIL', 'BLOCKED'):
                raise ValueError('invalid verdict')
            reason = record.get('reason', '')
            if state != 'PASS' and (not isinstance(reason, str) or not reason.strip()):
                raise ValueError('FAIL/BLOCKED requires reason')
            if cell['expected'] == 'BLOCKED':
                if state == 'PASS':
                    raise ValueError('expected BLOCKED cannot PASS')
                check_metrics(record, cell)
            elif state == 'PASS':
                check_metrics(record, cell)
        except (OSError, ValueError, KeyError, TypeError, AttributeError, struct.error, zlib.error) as exc:
            state, reason = 'FAIL', str(exc)
        results.append((cell['id'], state, reason))

    for ids in seen_hashes.values():
        if len(ids) > 1:
            print('WARN same screenshot bytes (review by eye): ' + ', '.join(ids))

    return check_pace(results, times, start, kong, records)


def check_pace(results, times, start, kong, records):
    problems, prev = {}, start
    for cid, t in sorted(times.items(), key=lambda kv: kv[1]):
        win = [e for e in kong if prev < e[0] <= t + 1]
        metrics = records.get(cid, {}).get('measurements', {})
        if t - prev < MIN_GAP_S:
            problems[cid] = f'pace {t - prev:.0f}s < {MIN_GAP_S}s after previous cell'
        elif cid.startswith('CSRF-'):
            upstream = [e for e in win if e[1].startswith('/auth/') or e[1] not in ('/status', '/metrics')]
            if len(upstream) > 0:
                problems[cid] = f'CSRF cell must have 0 upstream requests, but saw {len(upstream)}'
        elif cid.startswith('STAFF-'):
            if not any(path == '/auth/invite/accept' for _, path, _, _ in win):
                problems[cid] = 'no Kong entry for /auth/invite/accept in cell window'
        else:
            if 'postsSent' in metrics:
                activate_lines = [e for e in win if e[1] == '/auth/activate']
                if len(activate_lines) != metrics['postsSent']:
                    problems[cid] = f'postsSent mismatch: recorded {metrics["postsSent"]}, but Kong had {len(activate_lines)} activate entries'
            if cid not in problems:
                if cid.startswith('CONCURRENT-SUBMIT'):
                    activate_lines = [e for e in win if e[1] == '/auth/activate']
                    if len(activate_lines) == 0:
                        problems[cid] = 'no Kong upstream request for /auth/activate in cell window'
                    elif len(activate_lines) > 1:
                        problems[cid] = f'multiple Kong upstream requests ({len(activate_lines)}) during concurrent submit'
                elif cid.startswith('JOURNEY-LOGIN-OWNER'):
                    att = int(metrics.get('attackerLoginStatus', 401))
                    own = int(metrics.get('ownerLoginStatus', 200))
                    if not (any(path == '/auth/web/login' and s == att for _, path, s, _ in win) and
                            any(path == '/auth/web/login' and s == own for _, path, s, _ in win)):
                        problems[cid] = f'no Kong entry matching /auth/web/login with statuses {att} and {own}'
                elif 'httpStatus' in metrics and cid.startswith(KONG_FAMILIES):
                    exp_path = '/auth/activate/resend' if cid.startswith('RESEND-') else '/auth/activate'
                    exp_status = int(metrics['httpStatus'])
                    if not any(path == exp_path and s == exp_status for _, path, s, _ in win):
                        problems[cid] = f'no Kong entry matching {exp_path} with status {exp_status}'
            if cid not in problems and cid.startswith(KONG_FAMILIES) and not win:
                problems[cid] = 'no Kong traffic in cell window'
        prev = t
    return [(cid, 'FAIL', problems[cid]) if cid in problems else (cid, state, reason)
            for cid, state, reason in results]


def verdict(results):
    if any(r[1] == 'FAIL' for r in results):
        return 1
    if any(r[1] == 'BLOCKED' for r in results):
        return 2
    return 0


def png(w, h, rng):
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))
    pixels = (b'\0' + rng.randbytes(w)) * h
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(pixels))
            + chunk(b'IEND', b''))


def fixture(out):
    """Generates synthetic positive fixture for selftest; NOT an app PASS."""
    out.mkdir(parents=True, exist_ok=True)
    (out / 'shots').mkdir(parents=True, exist_ok=True)
    now = int(time.time())
    start = now - (MIN_GAP_S + 5) * (len(CELLS) + 2)
    iso = lambda t: datetime.fromtimestamp(t, timezone.utc).isoformat()
    (out / 'run.json').write_text(json.dumps(dict(
        runId='synthetic-run', tester='Anti', start=iso(start), end=iso(now), exit_code=0
    )))
    lines = []
    for i, cell in enumerate(CELLS):
        cid = cell['id']
        t_req = start + (MIN_GAP_S + 5) * i + (MIN_GAP_S + 2)
        def fmt(path, status, ua='node', meth='POST'):
            ts = datetime.fromtimestamp(t_req, timezone.utc).strftime('%d/%b/%Y:%H:%M:%S +0000')
            return f'127.0.0.1 - - [{ts}] "{meth} {path} HTTP/1.1" {status} 1 "-" "{ua}"\n'
        if cid.startswith(('UI-', 'VAL-', 'CSRF-')):
            lines.append(fmt('/status', 200, ua='node', meth='GET'))
        elif cid == 'JOURNEY-SUCCESS-desktop':
            lines.append(fmt('/auth/activate', 200))
        elif cid == 'JOURNEY-LOGIN-OWNER-desktop':
            lines.append(fmt('/auth/web/login', 401))
            lines.append(fmt('/auth/web/login', 200))
        elif cid == 'CONCURRENT-SUBMIT-desktop':
            lines.append(fmt('/auth/activate', 200))
        elif cid in ('TOKEN-CONSUMED-desktop', 'TOKEN-EXPIRED-desktop', 'TOKEN-WRONG-desktop'):
            lines.append(fmt('/auth/activate', 400))
        elif cid == 'RESEND-REQUEST-desktop':
            lines.append(fmt('/auth/activate/resend', 202))
        elif cid == 'RATE-LIMIT-desktop':
            lines.append(fmt('/auth/activate', 429))
        elif cid == 'SERVICE-BUSY-desktop':
            lines.append(fmt('/auth/activate', 503))
        elif cid == 'STAFF-INVITE-INDEPENDENT-desktop':
            lines.append(fmt('/auth/invite/accept', 200))
    (out / 'kong-access.log').write_text(''.join(lines))
    for name in ('tracked-before.diff', 'tracked-after.diff'):
        (out / name).write_text('synthetic-identical-diff-digest\n')
    rng = random.Random(42)
    for i, cell in enumerate(CELLS):
        image = png(*cell['size'], rng)
        (out / cell['screenshot']).write_bytes(image)
        metrics = {}
        for k, v in cell['criteria'].items():
            if isinstance(v, dict):
                metrics[k] = v.get('min', v.get('max'))
            else:
                metrics[k] = v
        record = {
            'id': cell['id'],
            'runId': 'synthetic-run',
            'route': cell['route'],
            'viewport': cell['viewport'],
            'fetchTime': iso(start + (MIN_GAP_S + 5) * (i + 1)),
            'verdict': cell['expected'],
            'reason': '',
            'screenshot': cell['screenshot'],
            'screenshotSha256': hashlib.sha256(image).hexdigest(),
            'measurements': metrics,
        }
        (out / cell['record']).write_text(json.dumps(record))


def self_test():
    results = []
    with tempfile.TemporaryDirectory(prefix='portal-activate-anti-self-', dir='/tmp') as directory:
        out = Path(directory) / 'out'
        fixture(out)
        kong = (out / 'kong-access.log').read_text()

        # Positive fixture selftest: valid structure passes grader checks in synthetic mode.
        result = grade(out, kong, is_synthetic=True)
        good_ok = (verdict(result) == 0 and all(r[1] == 'PASS' for r in result))
        results.append(('positive fixture (selftest only, not app PASS)', good_ok))

        # Synthetic fixture in live mode must be rejected as an app PASS.
        live_attempt = grade(out, kong, is_synthetic=False)
        results.append(('reject synthetic fixture as live app PASS', verdict(live_attempt) == 1))

        # Test empty run detection.
        empty_out = Path(directory) / 'empty_out'
        empty_out.mkdir()
        results.append(('reject empty run', verdict(grade(empty_out, kong)) == 1))

        original = {p: p.read_bytes() for p in out.rglob('*') if p.is_file()}
        first = out / CELLS[0]['record']

        trials = [
            'missing record',
            'duplicate record',
            'duplicate JSON key',
            'replayed runId',
            'old fetchTime',
            'future fetchTime',
            'wrong route',
            'wrong viewport',
            'missing screenshot',
            'wrong PNG size',
            'digest mismatch',
            'missing measurement',
            'locationSearchEmpty 0 (URL query not cleaned)',
            'noReferrerMeta 0 (missing no-referrer meta)',
            'zeroPostOnMount 0 (POST sent on mount)',
            'minTargetPx 40 (< 44px touch target)',
            'contrast 4.49 (< 4.5:1)',
            'axe serious 1',
            'keyboard 6 (< 7 checks)',
            'boolean metric',
            'nonfinite metric',
            'FAIL recorded',
            'tracked drift',
            'run incomplete',
            'run exit 2',
            'screenshot directory symlink',
            'pace too fast (< 20s)',
            'no Kong traffic',
            'backend cell only 429',
            'script client at Kong',
            'secret token leaked in record',
            'Kong status mismatch (RATE-LIMIT got 400)',
            'Kong status mismatch (SERVICE-BUSY got 400)',
            'CSRF with upstream Kong traffic',
            'STAFF missing /auth/invite/accept',
            'postsSent mismatch (JOURNEY-SUCCESS got 2 activates)',
            'CONCURRENT-SUBMIT missing upstream request',
            'Kong status mismatch (JOURNEY-LOGIN-OWNER owner got 500)',
        ]

        for name in trials:
            for path in out.rglob('*'):
                if path.is_file():
                    path.unlink()
            for path, data in original.items():
                path.write_bytes(data)
            record = read_json(first)
            target = first

            if name == 'missing record':
                first.unlink()
            elif name == 'duplicate record':
                (out / 'duplicate.json').write_bytes(first.read_bytes())
            elif name == 'duplicate JSON key':
                first.write_text(first.read_text()[:-1] + ',"id":"duplicate"}')
            elif name == 'replayed runId':
                record['runId'] = 'replayed-old-run-id'
            elif name == 'old fetchTime':
                record['fetchTime'] = '2000-01-01T00:00:00Z'
            elif name == 'future fetchTime':
                record['fetchTime'] = '2100-01-01T00:00:00Z'
            elif name == 'wrong route':
                record['route'] = '/wrong-route'
            elif name == 'wrong viewport':
                record['viewport'] = 'tablet'
            elif name == 'missing screenshot':
                (out / record['screenshot']).unlink()
            elif name == 'wrong PNG size':
                (out / record['screenshot']).write_bytes(png(390, 844, random.Random(7)))
            elif name == 'digest mismatch':
                record['screenshotSha256'] = '0' * 64
            elif name == 'missing measurement':
                record.pop('measurements')
            elif name == 'locationSearchEmpty 0 (URL query not cleaned)':
                record['measurements']['locationSearchEmpty'] = 0
            elif name == 'noReferrerMeta 0 (missing no-referrer meta)':
                record['measurements']['noReferrerMeta'] = 0
            elif name == 'zeroPostOnMount 0 (POST sent on mount)':
                record['measurements']['zeroPostOnMount'] = 0
            elif name == 'minTargetPx 40 (< 44px touch target)':
                record['measurements']['minTargetPx'] = 40
            elif name == 'contrast 4.49 (< 4.5:1)':
                record['measurements']['minContrast'] = 4.49
            elif name == 'axe serious 1':
                record['measurements']['axeSerious'] = 1
            elif name == 'keyboard 6 (< 7 checks)':
                record['measurements']['keyboardChecks'] = 6
            elif name == 'boolean metric':
                record['measurements']['zeroPostOnMount'] = True
            elif name == 'nonfinite metric':
                record['measurements']['minContrast'] = float('nan')
            elif name == 'FAIL recorded':
                record.update(verdict='FAIL', reason='observed failure in browser')
            elif name == 'tracked drift':
                (out / 'tracked-after.diff').write_text('modified-tracked-change\n')
            elif name == 'run incomplete':
                run = read_json(out / 'run.json')
                run['end'] = None
                (out / 'run.json').write_text(json.dumps(run))
            elif name == 'run exit 2':
                run = read_json(out / 'run.json')
                run['exit_code'] = 2
                (out / 'run.json').write_text(json.dumps(run))
            elif name == 'screenshot directory symlink':
                shots = out / 'shots'
                shots.rename(out / 'original-shots')
                shots.symlink_to(out / 'original-shots', target_is_directory=True)
            elif name == 'pace too fast (< 20s)':
                record['fetchTime'] = read_json(out / 'run.json')['start']
            elif name == 'secret token leaked in record':
                record['reason'] = 'raw_secret_token_leaked_value'

            if name not in ('missing record', 'duplicate JSON key'):
                target.write_text(json.dumps(record))

            log = '' if name == 'no Kong traffic' else kong
            if name == 'backend cell only 429':
                c = next(i for i, cell in enumerate(CELLS) if cell['id'].startswith('JOURNEY-'))
                log = ''.join(
                    l.replace('" 200 1 ', '" 429 1 ') if j == c else l
                    for j, l in enumerate(kong.splitlines(True))
                )
            elif name == 'script client at Kong':
                log = kong + kong.splitlines(True)[0].replace('"node"', '"Python-urllib/3.14"')
            elif name == 'Kong status mismatch (RATE-LIMIT got 400)':
                log = kong.replace('" 429 1 ', '" 400 1 ')
            elif name == 'Kong status mismatch (SERVICE-BUSY got 400)':
                log = kong.replace('" 503 1 ', '" 400 1 ')
            elif name == 'CSRF with upstream Kong traffic':
                csrf_cell = next(cell for cell in CELLS if cell['id'].startswith('CSRF-'))
                csrf_rec = read_json(out / csrf_cell['record'])
                csrf_t = stamp(csrf_rec['fetchTime'])
                ts = datetime.fromtimestamp(csrf_t - 2, timezone.utc).strftime('%d/%b/%Y:%H:%M:%S +0000')
                log = kong + f'127.0.0.1 - - [{ts}] "POST /auth/activate HTTP/1.1" 400 1 "-" "node"\n'
            elif name == 'STAFF missing /auth/invite/accept':
                log = kong.replace('/auth/invite/accept', '/auth/activate')
            elif name == 'postsSent mismatch (JOURNEY-SUCCESS got 2 activates)':
                c = next(i for i, cell in enumerate(CELLS) if cell['id'].startswith('JOURNEY-'))
                lines = kong.splitlines(True)
                lines.insert(c, lines[c])
                log = ''.join(lines)
            elif name == 'CONCURRENT-SUBMIT missing upstream request':
                c_idx = next(i for i, cell in enumerate(CELLS) if cell['id'].startswith('CONCURRENT-'))
                c_rec = read_json(out / CELLS[c_idx]['record'])
                c_t = stamp(c_rec['fetchTime'])
                log_lines = []
                for l in kong.splitlines(True):
                    m = kong_entries(l)
                    if m and m[0][0] <= c_t and m[0][0] > c_t - (MIN_GAP_S + 5) and m[0][1] == '/auth/activate':
                        log_lines.append(l.replace('/auth/activate', '/auth/web/login'))
                        continue
                    log_lines.append(l)
                log = ''.join(log_lines)
            elif name == 'Kong status mismatch (JOURNEY-LOGIN-OWNER owner got 500)':
                log = kong.replace('POST /auth/web/login HTTP/1.1" 200', 'POST /auth/web/login HTTP/1.1" 500')

            graded = grade(out, log, is_synthetic=True)
            results.append(('reject ' + name, verdict(graded) == 1))

            if name == 'screenshot directory symlink':
                (out / 'shots').unlink()
                (out / 'original-shots').rename(out / 'shots')

        if (ROOT / 'out').exists() and (ROOT / 'out' / 'run.json').exists():
            s8_res = grade(ROOT / 'out')
            s8_failed = {cid for cid, s, _ in s8_res if s == 'FAIL'}
            expected_failed = {
                'CONCURRENT-SUBMIT-desktop',
                'CSRF-CROSS-ORIGIN-desktop',
                'JOURNEY-SUCCESS-desktop',
                'RATE-LIMIT-desktop',
                'SERVICE-BUSY-desktop',
                'STAFF-INVITE-INDEPENDENT-desktop',
            }
            results.append(('replay S8 out/ fails exactly at 6 flawed cells', s8_failed == expected_failed and verdict(s8_res) == 1))

    for name, ok in results:
        print(f'{"PASS" if ok else "FAIL"} self-test {name}')
    passed = sum(ok for _, ok in results)
    total = len(results)
    print(f'GRADER SELF-TEST: {passed}/{total} {"PASS" if passed == total else "FAIL"} (synthetic fixtures verified; NOT an application acceptance PASS)')
    return int(passed != total)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('out', nargs='?', type=Path, default=ROOT / 'out')
    parser.add_argument('--self-test', action='store_true', help='run grader selftest with synthetic fixtures')
    parser.add_argument('--cells', help='comma-separated list of cell IDs to grade')
    args = parser.parse_args()

    if args.self_test:
        return self_test()

    if args.cells:
        wanted = set(args.cells.split(','))
        CELLS[:] = [c for c in CELLS if c['id'] in wanted]
        if {c['id'] for c in CELLS} != wanted:
            sys.exit('unknown cell id in --cells')

    results = grade(args.out)
    for cid, state, reason in results:
        print(f'{state} {cid}' + (f': {reason}' if reason else ''))
    counts = {state: sum(r[1] == state for r in results) for state in ('PASS', 'FAIL', 'BLOCKED')}
    code = verdict(results)
    print(f'Checklist cells: {len(CELLS)}; {counts}; VERDICT: {("PASS", "FAIL", "BLOCKED")[code]}')
    return code


if __name__ == '__main__':
    sys.exit(main())
