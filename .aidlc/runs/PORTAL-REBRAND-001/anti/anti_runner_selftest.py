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
if name == 'python3':
    code = sys.stdin.read() if a and a[0] == '-' else None
    if code and '# ANTI_PORT_PROBE' in code:
        sys.exit(0 if os.environ.get('SHIM_PORT') == ':' + a[1] else 1)
    sys.exit(subprocess.run([os.environ['SHIM_PYTHON'], *a], input=code, text=True).returncode)
elif name in ('node', 'brave'):
    if name == 'node':
        assert any(x.startswith('--env-file=') for x in a), 'server env missing'
        envfile = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--env-file=')))
        assert envfile == root / '.env.local' and '127.0.0.1:8000' in envfile.read_text()
    else:
        profile = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--user-data-dir=')))
        assert str(profile).startswith('/tmp/portal-anti-brave.')
    (root / (name + '.pid')).write_text(str(os.getpid()))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    while True: time.sleep(.1)
elif name == 'npm':
    assert a == ['run', 'build']
    print('Compiled successfully\nRoute (app)\n┌ ○ /\n├ ○ /login\n└ ƒ /console')
elif name == 'git':
    print(os.environ.get('SHIM_DIFF', ''), end='')
elif name == 'curl':
    if '--data-binary' in a:
        payload = pathlib.Path(a[a.index('--data-binary')+1][1:])
        assert payload.stat().st_mode & 0o777 == 0o600
        data = json.loads(payload.read_text())
        assert data == {'email': ('employee.s9@example.invalid' if 'employee' in data['email'] else 'customer.s9@example.invalid'), 'password': 'synthetic-secret'}
        assert a[-1] == 'http://127.0.0.1:3000/api/auth/login'
        if '--dump-header' in a:
            p = pathlib.Path(a[a.index('--dump-header')+1])
            assert p.stat().st_mode & 0o777 == 0o600
            p.write_text('HTTP/1.1 200 OK\r\nSet-Cookie: access_token=synthetic-cookie; Path=/; HttpOnly; Secure\r\n')
        print(os.environ.get('SHIM_LOGIN', '200'), end='')
    elif '--write-out' in a:
        print('200' if (root / 'node.pid').exists() else '000', end='')
    else:
        sys.exit(0 if os.environ.get('SHIM_PORT') in a[-1] and os.environ.get('SHIM_PORT') else 7)
elif name == 'npx':
    url = next(x for x in a if x.startswith('http:'))
    if url.endswith('/console'):
        header = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--extra-headers=')))
        assert header.stat().st_mode & 0o777 == 0o600
        assert json.loads(header.read_text()) == {'Cookie': 'access_token=synthetic-cookie'}
        if os.environ.get('SHIM_REDIRECT'): url = 'http://127.0.0.1:3000/login'
    else:
        assert not any(x.startswith('--extra-headers=') for x in a)
    out = pathlib.Path(next(x.split('=',1)[1] for x in a if x.startswith('--output-path=')))
    settings = {'formFactor': 'desktop' if '--preset=desktop' in a else 'mobile'}
    if url.endswith('/console') or os.environ.get('SHIM_REDIRECT'):
        settings['extraHeaders'] = {'Cookie': 'access_token=synthetic-cookie'}
    out.write_text(json.dumps({'finalUrl': url, 'configSettings': settings}))
    print('private diagnostic access_token=synthetic-cookie')
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
        for case in ('phases EOF', 'login 500', 'console redirect', 'existing run', 'port 3000', 'port 9222', 'tracked drift', 'foreign pid'):
            portal = base / case
            anti = portal / '.aidlc/runs/PORTAL-REBRAND-001/anti'
            anti.mkdir(parents=True)
            shutil.copyfile(runner, anti / 'anti.sh')
            (anti / 'accounts.local.md').write_text('PASSWORD: synthetic-secret\n| Role | Email | Context | Use for |\n| customer | customer.s9@example.invalid | test | test |\n| employee | employee.s9@example.invalid | test | test |\n')
            (portal / '.env.local').write_text('AUTH_SERVICE_URL=http://127.0.0.1:8000\n')
            for p in ('.next/static', '.next/standalone', 'public', 'bin'):
                (portal / p).mkdir(parents=True)
            for name in ('npm', 'node', 'curl', 'npx', 'brave', 'brave-browser', 'git', 'python3'):
                p = portal / 'bin' / name
                p.write_text(SHIM.replace('#!/usr/bin/env python3', '#!' + sys.executable, 1))
                p.chmod(0o755)
            env = dict(os.environ, PATH=f'{portal}/bin:' + os.environ['PATH'], SHIM_ROOT=str(portal), SHIM_PYTHON=sys.executable)
            if case == 'login 500': env['SHIM_LOGIN'] = '500'
            if case == 'console redirect': env['SHIM_REDIRECT'] = '1'
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
                elif case in ('login 500', 'port 3000', 'port 9222'):
                    pidfile = portal / 'node.pid'
                    ok = start.returncode == 2 and 'BLOCKED' in start.stderr and (not pidfile.exists() or not alive(int(pidfile.read_text())))
                    if case == 'login 500': ok = ok and 'BLOCKED login BFF 500' in start.stderr
                else:
                    assert start.returncode == 0, 'start failed'
                    for _ in range(100):
                        if (portal / 'brave.pid').exists(): break
                        time.sleep(.01)
                    assert alive(int((portal / 'node.pid').read_text())), 'server not left running'
                    lh = phase('lighthouse')
                    if case == 'console redirect':
                        ok = lh.returncode == 2 and 'BLOCKED' in lh.stderr
                    else:
                        paths = {f'lh-{r}-{f}.json' for r in ('home', 'login', 'console') for f in ('mobile', 'desktop')}
                        ok = lh.returncode == 0 and {p.name for p in (anti / 'out').glob('lh-*.json')} == paths
                        ok = ok and all(json.loads((anti / 'out' / p).read_text())['configSettings']['formFactor'] == p.split('-')[-1][:-5] for p in paths)
                    if case == 'tracked drift': env['SHIM_DIFF'] = 'synthetic tracked change'
                    if case == 'foreign pid':
                        foreign = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'], start_new_session=True)
                        (anti / 'out/brave.pid').write_text(str(foreign.pid))
                        (anti / 'out/brave.start').write_text('0')
                    stop = phase('stop')
                    run = json.loads((anti / 'out/run.json').read_text())
                    expected = 2 if case == 'console redirect' else 1 if case == 'tracked drift' else 0
                    ok = ok and stop.returncode == expected and run['exit_code'] == expected and run['end'] is not None
                    names = ('node',) if case == 'foreign pid' else ('node', 'brave')
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
                for name in ('node', 'brave'):
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
            check = '  [[ "$LOGIN_CODE" == 200 ]] || blocked "login BFF ${LOGIN_CODE:-000}"'
            if source.count(check) != 1:
                sys.exit('FAIL mutation target missing or ambiguous')
            mutant = Path(temp) / 'anti.sh'
            mutant.write_text(source.replace(check, '  : # MUTANT: login-200 guard removed'))
            code = suite(mutant)
            print(f'MUTATION: login-200 guard removed; self-test exit={code}; {"KILLED" if code else "SURVIVED"}')
            sys.exit(0 if code else 1)
    sys.exit(suite(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'anti.sh'))
