#!/usr/bin/env python3
"""Read-only acceptance gate; fixtures for --self-test stay inside this testkit."""
import argparse
import copy
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROLES = 'bg surface tint ink muted primary primary-ink primary-hover leaf accent accent-ink accent-hover sun info danger warn-ink line input-border focus'.split()
LIGHT = '#FBF6EE #FFFFFF #F5E9DA #2A1D17 #6F5C50 #D2402A #FFFFFF #B93623 #3E8E4A #F2A33A #2A1D17 #DB8A26 #F2A33A #2E6FAD #9B2C55 #805000 #EADFD0 #8A7464 #B93623'.split()
DARK = '#1D1714 #2A211C #352821 #F8EFE5 #C2B2A4 #F07A5F #1D1714 #E56449 #70B878 #F2A33A #2A1D17 #DB8A26 #F2A33A #8DB8E8 #E46A83 #F2C56F #49372C #8D7667 #F07A5F'.split()
EXPECTED = {'light': dict(zip(ROLES, LIGHT)), 'dark': dict(zip(ROLES, DARK))}
FONTS = {'display': '"Quicksand", system-ui, sans-serif', 'sans': '"Nunito", system-ui, -apple-system, "Segoe UI", sans-serif'}
OLD_GREEN = re.compile(r'#(?:1B5E20|14491A|F6F8F3|E8F3E4|14291A|5B6B5E|0F1A12|172619|1C3020|F1F6EE|A3B3A5|5FBF6A|7BD085|2F7D32|6FCB78|DCE5D8|2A3D2D|7D907F|6F8672|183126|1F5B3A|143D29|DFE9DC|77BD88|142D20|1B3023|111D16|0B140F|CDD8CA|2C4334|F0F4EE|364233|E0E7DC|192017|D6E0D3|242E20)\b', re.I)
FORBIDDEN = re.compile(r'Be[ _-]*Vietnam[ _-]*Pro|backdrop-blur[\w-]*|backdrop-filter\s*:|(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(|bg-(?:gradient|linear|radial|conic)[\w-]*|\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow)-(?:green|emerald|teal)-\d+|--land-(?:green|sage)\b', re.I)


def luminance(value):
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * w for c, w in zip(linear, [.2126, .7152, .0722]))


def contrast(fg, bg):
    a, b = sorted([luminance(fg), luminance(bg)])
    return (b + .05) / (a + .05)


def pairs():
    for mode, colors in EXPECTED.items():
        for bg in ['bg', 'surface', 'tint']:
            for fg in ['ink', 'muted', 'danger', 'info', 'warn-ink']:
                if mode == 'light' and fg == 'info' and bg == 'tint':
                    continue  # Forbidden combination: render ink text + info icon instead.
                yield mode, fg, bg, 4.5
        for fg, bg in [('primary-ink', 'primary'), ('primary-ink', 'primary-hover'), ('accent-ink', 'accent'), ('accent-ink', 'accent-hover'), ('accent-ink', 'sun'), ('primary-ink', 'danger')]:
            yield mode, fg, bg, 4.5
        # Light primary text on cream/tint fails AA: links use the darker hover role.
        for bg in ['bg', 'surface', 'tint']:
            yield mode, 'primary-hover' if mode == 'light' else 'primary', bg, 4.5
            for fg in ['input-border', 'focus']:
                yield mode, fg, bg, 3.0


def render(generator, root):
    result = subprocess.run(['python3', '-B', str(generator), 'tokens', '--root', str(root)], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    header, separator, css = result.stdout.partition('\n')
    if not separator or header != '# portal/app/tokens.generated.css':
        raise RuntimeError('unexpected uigen output header')
    return css


def check(root, generator, section='all', scan_paths=None):
    errors = []
    if section in ['all', 'tokens', 'contrast']:
        try:
            tokens = json.loads((root / 'platform-docs/ui/tokens.json').read_text())
            for mode, roles in EXPECTED.items():
                for role, expected in roles.items():
                    value = tokens['color'][mode][role]['$value']
                    if value.upper() != expected:
                        errors.append(f'TOKEN {mode}.{role}: {value} != {expected}')
            for role, expected in FONTS.items():
                if tokens['font'][role]['$value'] != expected:
                    errors.append(f'FONT font.{role}: expected {expected}')
            if section in ['all', 'tokens']:
                generated = root / 'portal/app/tokens.generated.css'
                if not generated.exists() or generated.read_text() != render(generator, root):
                    errors.append('DRIFT tokens.generated.css differs byte-for-byte from uigen(tokens.json)')
            for mode, fg, bg, threshold in pairs():
                colors = tokens['color'][mode]
                ratio = contrast(colors[fg]['$value'], colors[bg]['$value'])
                if ratio < threshold:
                    errors.append(f'CONTRAST {mode} {fg}/{bg}: {ratio:.2f} < {threshold}')
        except (OSError, KeyError, ValueError, TypeError, RuntimeError) as error:
            errors.append(f'CONFIG {error}')
    if section in ['all', 'scan']:
        files = [root / 'platform-docs/ui/tokens.json']
        if scan_paths:
            files.append(root / 'portal/app/tokens.generated.css')
            for relative in scan_paths:
                path = root / 'portal' / relative
                if not path.exists():
                    errors.append(f'MISSING scan target {relative}')
                files.extend(sorted(path.rglob('*')) if path.is_dir() else [path])
        else:
            for folder in ['app', 'components', 'features', 'public']:
                files.extend(sorted((root / 'portal' / folder).rglob('*')))
        for path in files:
            if not path.is_file() or path.suffix not in ['.json', '.css', '.tsx', '.ts', '.svg']:
                continue
            if '.test.' in path.name or '.spec.' in path.name:
                continue
            text = path.read_text(encoding='utf-8')
            # Comments/documentation aren't runtime styles. Preserve line numbering.
            text = re.sub(r'/\*.*?\*/', lambda m: '\n' * m[0].count('\n'), text, flags=re.S)
            for n, line in enumerate(text.splitlines(), 1):
                match = FORBIDDEN.search(line) or OLD_GREEN.search(line)
                if not match:
                    match = re.search(r'\.glass(?:-strong)?\s*\{', line)
                    for literal in re.finditer(r"(['\"])(.*?)\1", line):
                        match = match or re.search(r'(?<![-\w])glass(?:-strong)?(?![-\w])', literal[2])
                if match:
                    errors.append(f'LEFTOVER {path.relative_to(root)}:{n}: {match[0]}')
                # Any other raw green hue is also forbidden outside the approved leaf tokens.
                for value in re.findall(r'#[0-9a-fA-F]{6}\b', line):
                    r, g, b = [int(value[i:i + 2], 16) for i in (1, 3, 5)]
                    leaf = value.upper() in ['#3E8E4A', '#70B878'] and path.name in ['tokens.json', 'tokens.generated.css'] and ('leaf' in line or path.suffix == '.json')
                    if g > r * 1.1 and g > b * 1.05 and not leaf:
                        errors.append(f'GREEN {path.relative_to(root)}:{n}: {value}')
    return errors


def self_test(root, generator):
    # Synthetic ACCEPTED palette is independent of the current, intentionally old brand.
    fixture = {'color': {mode: {role: {'$type': 'color', '$value': value} for role, value in roles.items()} for mode, roles in EXPECTED.items()}, 'font': {role: {'$type': 'fontFamily', '$value': value} for role, value in FONTS.items()}}
    with tempfile.TemporaryDirectory(prefix='brand-mutants-', dir=Path(__file__).resolve().parent) as directory:
        sample = Path(directory)
        token_file = sample / 'platform-docs/ui/tokens.json'
        css_file = sample / 'portal/app/tokens.generated.css'
        leak_file = sample / 'portal/components/leak.tsx'
        for p in [token_file, css_file, leak_file]:
            p.parent.mkdir(parents=True, exist_ok=True)

        def reset(tokens=None):
            token_file.write_text(json.dumps(tokens or fixture, indent=2))
            css_file.write_text(render(generator, sample))
            leak_file.write_text('export const Status = () => <span className="text-[var(--color-ink)]">Sẵn sàng</span>;\n')

        reset()
        baseline = check(sample, generator)
        if baseline:
            raise RuntimeError('positive fixture failed: ' + '\n'.join(baseline))
        print('PASS positive fixture (v4 palette + prompt font overrides)')
        for name, fragment, expected in [
            ('M1 old green hex', '#1B5E20', 'LEFTOVER'),
            ('M2 old font', 'Be Vietnam Pro', 'LEFTOVER'),
            ('M3 dialog blur', 'backdrop-blur-md', 'LEFTOVER'),
            ('M4 Tailwind gradient', 'bg-gradient-to-tr', 'LEFTOVER'),
            ('M5 CSS gradient', 'linear-gradient(red, white)', 'LEFTOVER'),
            ('M6 green ramp', 'bg-emerald-600', 'LEFTOVER'),
        ]:
            reset()
            leak_file.write_text('export const leak = ' + json.dumps(fragment) + ';\n')
            assert any(e.startswith(expected) for e in check(sample, generator)), name
            print('PASS ' + name + ' -> red scan')
        reset()
        leak_file.write_text('export const permission = "break-glass";\n')
        assert not check(sample, generator), 'business break-glass must remain valid'
        print('PASS business break-glass is not a visual glass utility')
        reset()
        css_file.write_text(css_file.read_text() + '/* manual drift */\n')
        assert any(e.startswith('DRIFT') for e in check(sample, generator))
        print('PASS M7 generated CSS edit -> red drift')
        changed = copy.deepcopy(fixture)
        changed['color']['light']['primary']['$value'] = '#1B5E20'
        reset(changed)
        assert any(e.startswith('TOKEN light.primary') for e in check(sample, generator))
        print('PASS M8 source green + regeneration -> red token contract')
        changed = copy.deepcopy(fixture)
        changed['color']['light']['muted']['$value'] = '#CCCCCC'
        reset(changed)
        assert any(e.startswith('CONTRAST light muted/bg') for e in check(sample, generator))
        print('PASS M9 pale body text -> red contrast')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    default_root = Path(__file__).resolve().parents[5]
    parser.add_argument('--root', type=Path, default=default_root, help='ticket workspace containing portal/ and platform-docs/')
    parser.add_argument('--section', choices=['all', 'tokens', 'scan', 'contrast'], default='all')
    parser.add_argument('--scan-path', action='append', help='slice scope relative to portal; final gate must omit this option')
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--contrast-table', action='store_true')
    args = parser.parse_args()
    generator = args.root / 'platform-docs/scripts/uigen.py'
    if args.contrast_table:
        print('| Theme | Text/indicator | Background | Ratio | Threshold |')
        print('|---|---|---|---:|---:|')
        for mode, fg, bg, threshold in pairs():
            colors = EXPECTED[mode]
            print(f'| {mode} | {fg} {colors[fg]} | {bg} {colors[bg]} | {contrast(colors[fg], colors[bg]):.2f}:1 | {threshold}:1 |')
        return 0
    if args.self_test:
        self_test(args.root, generator)
        return 0
    errors = check(args.root, generator, args.section, args.scan_path)
    for error in errors:
        print(error)
    print(f'brand gate: {len(errors)} errors ({args.section})')
    return int(bool(errors))


if __name__ == '__main__':
    raise SystemExit(main())
