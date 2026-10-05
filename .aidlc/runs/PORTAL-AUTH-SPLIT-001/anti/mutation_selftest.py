#!/usr/bin/env python3
"""Remove the capture-window check on a private temporary copy; require red."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
TARGET = "            if not start <= stamp(record['fetchTime']) <= end:\n                raise ValueError('fetchTime outside run window')"
source = (ROOT / 'anti_check.py').read_text()
if source.count(TARGET) != 1:
    sys.exit('FAIL mutation target missing/ambiguous')
with tempfile.TemporaryDirectory(prefix='portal-auth-mutant-', dir='/tmp') as directory:
    temp = Path(directory)
    (temp / 'anti_check.py').write_text(source.replace(TARGET, '            pass # MUTANT: fetchTime guard removed'))
    shutil.copyfile(ROOT / 'checklist.json', temp / 'checklist.json')
    run = subprocess.run([sys.executable, str(temp / 'anti_check.py'), '--self-test'], stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=60)
    print(run.stdout, end='')
    print(run.stderr, end='')
    # old fetchTime is also caught by the pace check now; future fetchTime only by the window guard.
    killed = run.returncode == 1 and 'FAIL self-test reject future fetchTime' in run.stdout
    print(f'MUTATION: fetchTime-window check removed; self-test exit={run.returncode}; {"KILLED" if killed else "SURVIVED"}')
    sys.exit(0 if killed else 1)
