#!/usr/bin/env python3
"""Adapted rebrand file-evidence grader. Synthetic fixtures never attest live UI."""
import argparse
import hashlib
import json
import math
import random
import re
import struct
import subprocess
import sys
import tempfile
import time
import zlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Dawn 2026-10-04: mobile deferred; grade desktop only.
CELLS = [c for c in json.loads((ROOT / 'checklist.json').read_text())['cells'] if c['viewport'] == 'desktop']
# Run 1 wrote 96 cells in 75 s with zero Kong traffic on TOKEN/PLATFORM/JOURNEY cells.
MIN_GAP_S = 20
KONG = 'dcentervn-local-api-gateway-1'
# These cells cannot pass without a backend call; BFF has no local token check.
# UI-10/11 are the switch screens: they load org contexts, so a real visit reaches Kong (run 3 had none).
KONG_FAMILIES = ('CONTEXT-', 'COOKIE-', 'EMPLOYEE-', 'EXISTING-', 'JOURNEY-', 'PLATFORM-', 'RECOVERY-', 'TOKEN-', 'WRONG-', 'UI-10-', 'UI-11-')
KONG_LINE = re.compile(r'\[(\d\d/\w{3}/\d{4}:\d\d:\d\d:\d\d [+-]\d{4})\] "[A-Z]+ (\S+) [^"]*" (\d{3}) \S+ "[^"]*" "([^"]*)"')


def kong_entries(text):
    return [(datetime.strptime(m[1], '%d/%b/%Y:%H:%M:%S %z').timestamp(), m[2], int(m[3]), m[4]) for m in KONG_LINE.finditer(text)]


def scripted(entry):
    # Run 2: Python-urllib hit Kong directly. BFF sends "node"/"portal-bff" or forwards the browser UA.
    _, path, _, ua = entry
    return not (ua in ('node', 'portal-bff') or ua.startswith(('Mozilla/', 'portal-bff/'))
                or (ua.startswith('curl/') and path in ('/status', '/metrics')))


def live_kong(start, end):
    # Source of truth is the container, not a file in out/ that the tester can edit.
    return subprocess.run(['docker', 'logs', '--since', str(int(start) - 1), '--until', str(int(end) + 2), KONG],
                          capture_output=True, text=True, check=True, timeout=60).stdout


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
    return json.loads(path.read_text(), object_pairs_hook=unique)


def check_metrics(record, cell):
    metrics = record['measurements']
    for name, expected in cell['criteria'].items():
        value = metrics[name]
        if not numeric(value) or value < 0:
            raise ValueError(f'measurement {name} missing/invalid')
        if isinstance(expected, dict):
            ok = value >= expected['min'] if 'min' in expected else value <= expected['max']
        else:
            ok = value == expected
        if not ok:
            raise ValueError(f'measurement {name} threshold failed')


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
                raise ValueError('wrong viewport PNG or unsupported encoding (use standard RGB/RGBA PNG)')
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


def grade(out, kong_text=None):
    results, seen_hashes, times = [], {}, {}
    try:
        if out.is_symlink() or (out / 'shots').is_symlink():
            raise ValueError('symlink evidence directory')
        run = read_json(out / 'run.json')
        start, end = stamp(run['start']), stamp(run['end'])
        if start > end or not isinstance(run['runId'], str) or not run['runId'] or run['tester'] != 'Anti':
            raise ValueError('invalid run window/identity')
        if run['exit_code'] != 0:
            raise ValueError('runner exit_code not zero')
        before, after = (out / 'tracked-before.diff').read_bytes(), (out / 'tracked-after.diff').read_bytes()
        if not before or before != after:
            raise ValueError('tracked diff changed or missing')
        expected = {'run.json'} | {c['record'] for c in CELLS}
        if {p.name for p in out.glob('*.json')} != expected:
            raise ValueError('missing/duplicate/unexpected JSON record')
        if {p.name for p in (out / 'shots').glob('*')} != {Path(c['screenshot']).name for c in CELLS}:
            raise ValueError('missing/duplicate/unexpected screenshot')
        kong = kong_entries(live_kong(start, end) if kong_text is None else kong_text)
        if any(scripted(e) for e in kong):
            raise ValueError('non-browser client called Kong during run: ' + ', '.join(sorted({e[3] for e in kong if scripted(e)})))
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError) as exc:
        return [(c['id'], 'FAIL', f'run: {exc}') for c in CELLS]
    for cell in CELLS:
        state, reason = 'FAIL', ''
        try:
            record = read_json(out / cell['record'])
            for field in ('id', 'route', 'viewport', 'screenshot'):
                if record[field] != cell[field]:
                    raise ValueError(f'{field} mismatch')
            if record['runId'] != run['runId']:
                raise ValueError('replayed runId')
            # Mutation target: fetchTime run-window guard.
            if not start <= stamp(record['fetchTime']) <= end:
                raise ValueError('fetchTime outside run window')
            times[cell['id']] = stamp(record['fetchTime'])
            digest = check_png(out / cell['screenshot'], cell['size'])
            if digest != record['screenshotSha256']:
                raise ValueError('screenshot digest mismatch')
            # Run 3: identical pages give byte-identical browser screenshots, so duplicates are a review list, not FAIL.
            seen_hashes.setdefault(digest, []).append(cell['id'])
            state = record['verdict']
            if state not in ('PASS', 'FAIL', 'BLOCKED'):
                raise ValueError('invalid verdict')
            reason = record.get('reason', '')
            if state != 'PASS' and (not isinstance(reason, str) or not reason.strip()):
                raise ValueError('FAIL/BLOCKED requires reason')
            if cell['expected'] == 'BLOCKED':
                if state == 'PASS':
                    raise ValueError('D3 cannot PASS')
                if state == 'BLOCKED':
                    check_metrics(record, cell)
            elif state == 'PASS':
                check_metrics(record, cell)
        except (OSError, ValueError, KeyError, TypeError, AttributeError, struct.error, zlib.error) as exc:
            state, reason = 'FAIL', str(exc)
        results.append((cell['id'], state, reason))
    for ids in seen_hashes.values():
        if len(ids) > 1:
            print('WARN same screenshot bytes (review by eye): ' + ', '.join(ids))
    return check_pace(results, times, start, kong)


def check_pace(results, times, start, kong):
    problems, prev = {}, start
    for cid, t in sorted(times.items(), key=lambda kv: kv[1]):
        if t - prev < MIN_GAP_S:
            problems[cid] = f'pace {t - prev:.0f}s < {MIN_GAP_S}s after previous cell'
        elif cid.startswith(KONG_FAMILIES) and not any(prev - 1 < k <= t + 1 and status != 429 for k, _, status, _ in kong):
            problems[cid] = 'no non-429 Kong response inside this cell window'
        prev = t
    return [(cid, 'FAIL', problems[cid]) if cid in problems else (cid, state, reason) for cid, state, reason in results]


def verdict(results):
    return 1 if any(r[1] == 'FAIL' for r in results) else 2 if any(r[1] == 'BLOCKED' for r in results) else 0


def png(w, h, rng):
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))
    # Unique real grayscale PNG; constant rows keep offline tests fast.
    pixels = (b'\0' + rng.randbytes(w)) * h
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w,h,8,0,0,0,0)) + chunk(b'IDAT',zlib.compress(pixels)) + chunk(b'IEND',b'')


def fixture(out):
    """Independent positives with real PNG encoding; no real browser claims."""
    out.mkdir(); (out / 'shots').mkdir()
    now = int(time.time())
    start = now - 30 * (len(CELLS) + 2)
    iso = lambda t: datetime.fromtimestamp(t, timezone.utc).isoformat()
    (out / 'run.json').write_text(json.dumps(dict(runId='synthetic-run', tester='Anti', start=iso(start), end=iso(now), exit_code=0)))
    (out / 'kong-access.log').write_text(''.join(
        datetime.fromtimestamp(start + 30 * i + 25, timezone.utc).strftime('1.2.3.4 - - [%d/%b/%Y:%H:%M:%S +0000] "POST /auth/x HTTP/1.1" 200 1 "-" "node"\n')
        for i in range(len(CELLS))))
    for name in ('tracked-before.diff', 'tracked-after.diff'):
        (out / name).write_text('synthetic-identical-diff-digest\n')
    rng = random.Random(901)
    for i, cell in enumerate(CELLS):
        image = png(*cell['size'], rng)
        (out / cell['screenshot']).write_bytes(image)
        metrics = {k: v.get('min', v.get('max')) if isinstance(v, dict) else v for k,v in cell['criteria'].items()}
        record = {k: cell[k] for k in ('id','route','viewport','screenshot')}
        record.update(runId='synthetic-run', fetchTime=iso(start + 30 * (i + 1)), verdict=cell['expected'], reason='D3 unavailable' if cell['expected']=='BLOCKED' else '', measurements=metrics, screenshotSha256=hashlib.sha256(image).hexdigest())
        (out / cell['record']).write_text(json.dumps(record))


def self_test():
    results = []
    with tempfile.TemporaryDirectory(prefix='portal-auth-self-',dir='/tmp') as directory:
        out = Path(directory)/'out'; fixture(out)
        kong = (out/'kong-access.log').read_text()
        result = grade(out, kong)
        blocked = sum(c['expected']=='BLOCKED' for c in CELLS)
        results.append(('good fixture; D3 BLOCKED aggregate exit 2',verdict(result)==2 and sum(r[1]=='BLOCKED' for r in result)==blocked and not any(r[1]=='FAIL' for r in result)))
        original = {p:p.read_bytes() for p in out.rglob('*') if p.is_file()}
        first = out / CELLS[0]['record']
        trials = ['missing record','duplicate record','duplicate JSON key','replayed runId','old fetchTime','future fetchTime','wrong route','wrong viewport','missing screenshot','wrong PNG size','digest mismatch','missing measurement','contrast 4.49','axe serious 1','keyboard 6','boolean metric','nonfinite metric','FAIL recorded','BLOCKED no reason','D3 false PASS','D3 wrong 200','tracked drift','run incomplete','run exit 2','CSRF wrong code','CSRF wrong message','CSRF cookie','screenshot directory symlink','pace too fast','no Kong traffic','TOKEN cell without Kong','TOKEN cell only 429','script client at Kong']
        for name in trials:
            for path in out.rglob('*'):
                if path.is_file(): path.unlink()
            for path,data in original.items(): path.write_bytes(data)
            record=read_json(first); target=first
            if name=='missing record': first.unlink()
            elif name=='duplicate record': (out/'duplicate.json').write_bytes(first.read_bytes())
            elif name=='duplicate JSON key': first.write_text(first.read_text()[:-1]+',"id":"duplicate"}')
            elif name=='replayed runId': record['runId']='old-run'
            elif name=='old fetchTime': record['fetchTime']='2000-01-01T00:00:00Z'
            elif name=='future fetchTime': record['fetchTime']='2100-01-01T00:00:00Z'
            elif name=='wrong route': record['route']='/staff/login'
            elif name=='wrong viewport': record['viewport']='mobile'
            elif name=='missing screenshot': (out/record['screenshot']).unlink()
            elif name=='wrong PNG size': (out/record['screenshot']).write_bytes(png(390, 844, random.Random(7)))
            elif name=='pace too fast': record['fetchTime']=read_json(out/'run.json')['start']
            elif name=='digest mismatch': record['screenshotSha256']='0'*64
            elif name=='missing measurement': record.pop('measurements')
            elif name=='contrast 4.49': record['measurements']['minContrast']=4.49
            elif name=='axe serious 1': record['measurements']['axeSerious']=1
            elif name=='keyboard 6': record['measurements']['keyboardChecks']=6
            elif name=='boolean metric': record['measurements']['mainCount']=True
            elif name=='nonfinite metric': record['measurements']['minContrast']=float('nan')
            elif name=='FAIL recorded': record.update(verdict='FAIL',reason='observed failure')
            elif name=='BLOCKED no reason': record.update(verdict='BLOCKED',reason='')
            elif name.startswith('D3'):
                c=next(c for c in CELLS if c['id'].startswith('D3-')); target=out/c['record']; record=read_json(target)
                if name=='D3 false PASS': record['verdict']='PASS'
                else: record['measurements']['httpStatus']=200
            elif name.startswith('CSRF'):
                c=next(c for c in CELLS if c['id'].startswith('CSRF-')); target=out/c['record']; record=read_json(target)
                metric={'CSRF wrong code':'forbiddenCode', 'CSRF wrong message':'invalidRequestMessage', 'CSRF cookie':'newCookies'}[name]
                record['measurements'][metric]=1 if name=='CSRF cookie' else 0
            elif name=='screenshot directory symlink':
                shots=out/'shots'; shots.rename(out/'original-shots'); shots.symlink_to(out/'original-shots',target_is_directory=True)
            elif name=='tracked drift': (out/'tracked-after.diff').write_text('changed')
            elif name.startswith('run '):
                run=read_json(out/'run.json')
                if name=='run incomplete': run['end']=None
                else: run['exit_code']=2
                (out/'run.json').write_text(json.dumps(run))
            if name not in ('missing record','duplicate JSON key'): target.write_text(json.dumps(record))
            log = '' if name=='no Kong traffic' else kong
            if name=='TOKEN cell without Kong':
                c=next(i for i,c in enumerate(CELLS) if c['id'].startswith('TOKEN-'))
                log = ''.join(l for j,l in enumerate(kong.splitlines(True)) if j!=c)
            if name=='TOKEN cell only 429':
                c=next(i for i,c in enumerate(CELLS) if c['id'].startswith('TOKEN-'))
                log = ''.join(l.replace('" 200 1 ','" 429 1 ') if j==c else l for j,l in enumerate(kong.splitlines(True)))
            if name=='script client at Kong':
                log = kong + kong.splitlines(True)[0].replace('"node"','"Python-urllib/3.14"')
            graded=grade(out, log)
            results.append(('reject '+name,verdict(graded)==1))
            if name=='screenshot directory symlink':
                (out/'shots').unlink(); (out/'original-shots').rename(out/'shots')
    for name,ok in results: print(f'{"PASS" if ok else "FAIL"} self-test {name}')
    passed=sum(ok for _,ok in results)
    print(f'SELF-TEST: {passed}/{len(results)} {"PASS" if passed==len(results) else "FAIL"} (synthetic only)')
    return int(passed!=len(results))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('out',nargs='?',type=Path,default=ROOT/'out')
    parser.add_argument('--self-test',action='store_true')
    parser.add_argument('--cells',help='comma-separated ids for a supplement run (Dawn-approved partial rerun)')
    args=parser.parse_args()
    if args.cells:
        wanted=set(args.cells.split(','))
        CELLS[:]=[c for c in CELLS if c['id'] in wanted]
        if {c['id'] for c in CELLS}!=wanted: sys.exit('unknown cell id in --cells')
    if args.self_test: return self_test()
    results=grade(args.out)
    for id,state,reason in results: print(f'{state} {id}'+(f': {reason}' if reason else ''))
    counts={state:sum(r[1]==state for r in results) for state in ('PASS','FAIL','BLOCKED')}
    code=verdict(results)
    print(f'Checklist cells: {len(CELLS)}; {counts}; VERDICT: {("PASS","FAIL","BLOCKED")[code]}')
    return code


if __name__=='__main__': sys.exit(main())
