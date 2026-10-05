#!/usr/bin/env python3
"""Offline runner regressions. All accounts/artifacts here are synthetic, in /tmp."""
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent
SHIM = r'''#!/usr/bin/env python3
import json, os, pathlib, signal, subprocess, sys, time
name = pathlib.Path(sys.argv[0]).name
if name == 'brave-browser': name = 'brave'
a = sys.argv[1:]
root = pathlib.Path(os.environ['SHIM_ROOT'])
if name == 'python3' and '-m' in a:
    directory = pathlib.Path(a[a.index('--directory')+1])
    assert {p.name for p in directory.iterdir()} == {'attacker.html'}, 'attacker exposes private files'
    (root / 'attacker.pid').write_text(str(os.getpid()))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    while True: time.sleep(.1)
elif name == 'python3':
    code = sys.stdin.read() if a and a[0] == '-' else None
    if code and '# ANTI_PORT_PROBE' in code:
        sys.exit(0 if os.environ.get('SHIM_PORT') == ':' + a[1] else 1)
    sys.exit(subprocess.run([os.environ['SHIM_PYTHON'], *a], input=code, text=True).returncode)
elif name in ('node', 'brave'):
    if name == 'node':
        assert any(x.startswith('--env-file=') for x in a), 'server env missing'
        envfile = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--env-file=')))
        assert envfile == root / '.env.local' and '127.0.0.1:8000' in envfile.read_text()
        runtime = pathlib.Path(a[-1]).parent
        assert (runtime / '.next/static/synthetic.js').read_text() == '// static fixture'
        assert (runtime / 'public/synthetic.svg').read_text() == '<svg/>'
        assert str(runtime).startswith('/tmp/portal-anti-secrets.')
    else:
        profile = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--user-data-dir=')))
        assert str(profile).startswith('/tmp/portal-anti-brave.')
    (root / (name + '.pid')).write_text(str(os.getpid()))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    while True: time.sleep(.1)
elif name == 'npm':
    sys.exit('FAIL runner must never build')
elif name == 'git':
    print(os.environ.get('SHIM_DIFF', ''), end='')
elif name == 'docker':
    sys.exit(0)
elif name == 'curl':
    if any('127.0.0.1:8001' in x for x in a):
        if '--write-out' in a: print('200', end='')
        else: pathlib.Path(a[a.index('--output')+1]).write_text('kong_http_requests_total 0\n')
    elif '--data-binary' in a:
        assert a[a.index('--data-binary')+1] == '{}'
        assert a[-1] == 'http://127.0.0.1:3000/api/auth/staff/login'
        assert 'Content-Type: application/json' in a
        assert 'Sec-Fetch-Site: same-origin' in a, 'readiness lacks trusted fetch metadata'
        assert 'Origin: http://127.0.0.1:3000' in a
        print(os.environ.get('SHIM_LOGIN', '400'), end='')
    elif '--write-out' in a:
        print('200' if (root / 'node.pid').exists() else '000', end='')
    else:
        sys.exit(0 if os.environ.get('SHIM_PORT') in a[-1] and os.environ.get('SHIM_PORT') else 7)
'''


def alive(pid):
    try:
        return Path(f'/proc/{pid}/stat').read_text().split(') ')[1][0] != 'Z'
    except FileNotFoundError:
        return False


def suite(runner):
    results = []
    with tempfile.TemporaryDirectory(prefix='anti-runner-self-', dir='/tmp') as temp:
        base = Path(temp)
        for case in ('phases EOF', 'BFF 500', 'existing run', 'port 3000', 'port 9222', 'port 3001', 'tracked drift', 'foreign pid', 'missing build'):
            portal = base / case
            anti = portal / '.aidlc/runs/PORTAL-AUTH-SPLIT-001/anti'
            anti.mkdir(parents=True)
            shutil.copyfile(runner, anti / 'anti.sh')
            (anti / 'attacker.html').write_text('<html>synthetic attacker</html>')
            (anti / 'accounts.local.md').write_text('PASSWORD: synthetic-secret\n| Role | Email | Context | Use for |\n| customer | customer.s9@example.invalid | test | test |\n| employee | employee.s9@example.invalid | test | test |\n')
            (portal / '.env.local').write_text('AUTH_SERVICE_URL=http://127.0.0.1:8000\n')
            for p in ('.next/static', '.next/standalone', 'public', 'bin'):
                (portal / p).mkdir(parents=True)
            (portal / '.next/static/synthetic.js').write_text('// static fixture')
            (portal / 'public/synthetic.svg').write_text('<svg/>')
            for name in ('npm', 'node', 'curl', 'npx', 'brave', 'brave-browser', 'git', 'python3', 'docker'):
                p = portal / 'bin' / name
                p.write_text(SHIM.replace('#!/usr/bin/env python3', '#!' + sys.executable, 1))
                p.chmod(0o755)
            if case != 'missing build': (portal / '.next/standalone/server.js').write_text('// prebuilt fixture')
            env = dict(os.environ, PATH=f'{portal}/bin:' + os.environ['PATH'], SHIM_ROOT=str(portal), SHIM_PYTHON=sys.executable)
            if case == 'BFF 500': env['SHIM_LOGIN'] = '500'
            if case.startswith('port '): env['SHIM_PORT'] = ':' + case.split()[1]
            if case == 'existing run':
                (anti / 'out').mkdir()
                (anti / 'out/run.json').write_text('existing-evidence')

            def phase(name):
                with open(os.devnull) as stdin:
                    return subprocess.run(['bash', str(anti / 'anti.sh'), name], cwd=portal, env=env,
                                          stdin=stdin, capture_output=True, text=True, timeout=20)

            foreign = None
            try:
                start = phase('start')
                if case == 'existing run':
                    ok = start.returncode != 0 and (anti / 'out/run.json').read_text() == 'existing-evidence' and not (portal / 'node.pid').exists()
                elif case in ('BFF 500', 'port 3000', 'port 9222', 'port 3001', 'missing build'):
                    pidfile = portal / 'node.pid'
                    ok = start.returncode == 2 and 'BLOCKED' in start.stderr and (not pidfile.exists() or not alive(int(pidfile.read_text())))
                    if case == 'BFF 500': ok = ok and 'BLOCKED readiness BFF 500' in start.stderr
                else:
                    assert start.returncode == 0, 'start failed'
                    for _ in range(100):
                        if (portal / 'brave.pid').exists(): break
                        time.sleep(.01)
                    assert alive(int((portal / 'node.pid').read_text())), 'server not left running'
                    ok = True
                    if case == 'tracked drift': env['SHIM_DIFF'] = 'synthetic tracked change'
                    if case == 'foreign pid':
                        foreign = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True)
                        (anti / 'out/brave.pid').write_text(str(foreign.pid))
                        (anti / 'out/brave.start').write_text('0')
                    stop = phase('stop')
                    run = json.loads((anti / 'out/run.json').read_text())
                    expected = 1 if case == 'tracked drift' else 0
                    repeated = phase('stop')
                    ok = ok and repeated.returncode == 2 and json.loads((anti / 'out/run.json').read_text())['end'] == run['end']
                    ok = ok and stop.returncode == expected and run['exit_code'] == expected and run['end'] is not None
                    names = ('node', 'attacker') if case == 'foreign pid' else ('node', 'brave', 'attacker')
                    ok = ok and all(not alive(int((portal / (n + '.pid')).read_text())) for n in names)
                    if foreign is not None: ok = ok and foreign.poll() is None
                    profile = anti / 'out/brave-profile.txt'
                    ok = ok and (not profile.exists() or not Path(profile.read_text().strip()).exists())
                    secrets = anti / 'out/secret-dir.txt'
                    ok = ok and (not secrets.exists() or not Path(secrets.read_text().strip()).exists())
                # No synthetic secret may leak into phase output or evidence.
                ok = ok and 'synthetic-secret' not in start.stdout + start.stderr
                ok = ok and all(b'synthetic-secret' not in p.read_bytes() and b'synthetic-cookie' not in p.read_bytes()
                                for p in (anti / 'out').rglob('*') if p.is_file())
            except (AssertionError, subprocess.TimeoutExpired, OSError, ValueError, KeyError) as exc:
                ok = False
                print(f'FAIL detail {case}: {type(exc).__name__}: {exc}')
            finally:
                if foreign is not None:
                    foreign.terminate()
                    foreign.wait(timeout=5)
                for name in ('node', 'brave', 'attacker'):
                    p = portal / (name + '.pid')
                    if p.exists() and alive(int(p.read_text())):
                        os.killpg(int(p.read_text()), signal.SIGTERM)
                for filename in ('brave-profile.txt', 'secret-dir.txt'):
                    p = anti / 'out' / filename
                    if p.exists():
                        target = Path(p.read_text().strip())
                        if str(target).startswith(('/tmp/portal-anti-brave.', '/tmp/portal-anti-secrets.')):
                            shutil.rmtree(target, ignore_errors=True)
            results.append(ok)
            print(f'{"PASS" if ok else "FAIL"} runner {case}')
    print(f'RUNNER SELF-TEST: {sum(results)}/{len(results)} (offline synthetic shims only)')
    return int(not all(results))


if __name__ == '__main__':
    if sys.argv[1:] == ['--mutation']:
        with tempfile.TemporaryDirectory(prefix='anti-runner-mutation-', dir='/tmp') as temp:
            source = (ROOT / 'anti.sh').read_text()
            check = '  [[ "$LOGIN_CODE" == 400 ]] || blocked "readiness BFF ${LOGIN_CODE:-000} (expected 400)"'
            if source.count(check) != 1:
                sys.exit('FAIL mutation target missing or ambiguous')
            mutant = Path(temp) / 'anti.sh'
            mutant.write_text(source.replace(check, '  : # MUTANT: BFF-400 guard removed'))
            code = suite(mutant)
            print(f'MUTATION: BFF-400 guard removed; self-test exit={code}; {"KILLED" if code else "SURVIVED"}')
            sys.exit(0 if code else 1)
    sys.exit(suite(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'anti.sh'))
