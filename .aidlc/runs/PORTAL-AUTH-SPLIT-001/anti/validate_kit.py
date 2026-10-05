#!/usr/bin/env python3
"""Offline, repeatable validation transcript; writes only validation.txt here."""
import ast
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
commands = [
    ['rtk', 'proxy', 'bash', '-n', 'anti.sh'],
    ['rtk', 'proxy', 'python3', 'anti_check.py', '--self-test'],
    ['rtk', 'proxy', 'python3', 'anti_runner_selftest.py'],
    ['rtk', 'proxy', 'python3', 'mutation_selftest.py'],
    ['rtk', 'proxy', 'python3', 'anti_runner_selftest.py', '--mutation'],
]
previous = (ROOT / 'validation.txt').read_text() if (ROOT / 'validation.txt').exists() else ''
red = previous.split('GREEN validation proof')[0] if previous.startswith('RED regression proof') else ''
lines = [f'CWD: {ROOT}', 'Invocation: rtk proxy python3 validate_kit.py </dev/null',
         'Offline synthetic fixtures only. No live acceptance was performed.',
         'Scope: kit-only plan/cook/test/ship handback. hs-cli --help and hs-run --help inspected read-only.',
         'Harness receipts were not generated: they write outside the user-authorized anti/ boundary.', '']
failed = False
for command in commands:
    lines.append('$ ' + ' '.join(command) + ' </dev/null')
    run = subprocess.run(command, cwd=ROOT, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=60)
    lines.extend([run.stdout.rstrip() or '(no stdout)', run.stderr.rstrip() or '(no stderr)', f'exit={run.returncode}', ''])
    failed |= run.returncode != 0
for path in ROOT.glob('*.py'):
    ast.parse(path.read_text(),filename=str(path))
lines.append('Python AST syntax check: PASS (no bytecode writes)')
cells = json.loads((ROOT / 'checklist.json').read_text())['cells']
assert len(cells) == len({c['id'] for c in cells}) == 96
assert len({c['record'] for c in cells}) == len({c['screenshot'] for c in cells}) == 96
assert all(c['size'] == {'mobile': [390, 844], 'desktop': [1440, 900]}[c['viewport']] for c in cells)
assert all(c['record'] == c['id'] + '.json' and c['screenshot'] == 'shots/' + c['id'] + '.png' for c in cells)
expected_routes = {'/login', '/register', '/activate', '/forgot-password', '/reset-password',
                   '/staff/login', '/staff/forgot-password', '/staff/reset-password',
                   '/staff/invite/accept', '/staff/switch-branch', '/staff/switch-org'}
ui = [c for c in cells if c['id'].startswith('UI-')]
assert {(c['route'], c['viewport']) for c in ui} == {(r, v) for r in expected_routes for v in ('mobile', 'desktop')}
assert all(c['criteria']['axeSerious'] == c['criteria']['axeCritical'] == 0 and
           c['criteria']['minContrast'] == {'min': 4.5} and c['criteria']['keyboardChecks'] == 7 for c in ui)
csrf = [c for c in cells if c['id'].startswith('CSRF-')]
assert len(csrf) == 4
assert all(c['criteria']['httpStatus'] == 403 and c['criteria']['newCookies'] == 0 and
           c['criteria']['forbiddenCode'] == c['criteria']['invalidRequestMessage'] == 1 and
           'Yêu cầu không hợp lệ' in c['steps'] and 'FORBIDDEN' in c['steps'] for c in csrf)
assert {(c['route'], c['viewport']) for c in cells if c['id'].startswith('GUARD-')} == {
    (r, v) for r in ('/inventory/shelves', '/platform/companies') for v in ('mobile', 'desktop')}
assert all(c['expected'] == 'BLOCKED' and c['criteria']['httpStatus'] == 503 and
           c['criteria']['unavailableMessage'] == 1 for c in cells if c['id'].startswith('D3-'))
assert all(c['criteria']['inviteStatus'] == c['criteria']['loginStatus'] == 200 and
           c['criteria']['activatedVisible'] == 1 for c in cells if c['id'].startswith('JOURNEY-staff-'))
assert not (ROOT / 'handback.md').exists()
assert sum(c['id'].startswith('UI-') for c in cells) == 22
assert sum(c['id'].startswith('LEGACY-') for c in cells) == 6
assert sum(c['id'].startswith('D3-') for c in cells) == 4
assert all(c['id'] in (ROOT / 'anti-test.md').read_text() for c in cells)
lines.append('Checklist consistency: PASS; UI=22/22; legacy=6/6; D3 expected BLOCKED=4')
lines.append(f'Checklist cell count: {len(cells)}')
lines.append('KIT VALIDATION: ' + ('FAIL' if failed else 'PASS'))
(ROOT / 'validation.txt').write_text(red + 'GREEN validation proof\n' + '\n'.join(lines)+'\n')
print('\n'.join(lines))
sys.exit(int(failed))
