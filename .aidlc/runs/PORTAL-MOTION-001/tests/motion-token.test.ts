import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const css = readFileSync(resolve(process.cwd(), process.env.TOKENS_CSS ?? 'app/tokens.generated.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));
const light = blocks.find(block => block.selector.startsWith(':root'))?.body ?? '';
const dark = blocks.find(block => /\.dark|data-theme="dark"/.test(block.selector))?.body ?? '';
const read = (body: string, name: string) => body.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
const ms = (value?: string) => (value?.endsWith('ms') ? parseFloat(value) : NaN);

const durations = { 'motion-press': 80, 'motion-hover': 120, 'motion-enter': 180, 'motion-exit': 120, 'motion-sheet': 220 };
const easings = { 'motion-ease-out': 'ease-out', 'motion-ease-in': 'ease-in', 'motion-ease-enter': 'cubic-bezier(.2,.8,.2,1)' };

for (const [name, value] of Object.entries(durations)) {
  test(`UX-13 --${name} = ${value}ms in :root`, () => {
    assert.ok(read(light, name), `thiếu --${name} ở :root`);
    assert.equal(ms(read(light, name)), value);
  });
}
for (const [name, value] of Object.entries(easings)) {
  test(`UX-13 --${name} = ${value} in :root`, () => {
    assert.ok(read(light, name), `thiếu --${name} ở :root`);
    assert.equal(read(light, name)?.replace(/\s+/g, '').replace(/\b0\./g, '.'), value);
  });
}
test('UX-13 no console duration token above 300ms', () => {
  const all = [...light.matchAll(/--motion-[a-z-]+:\s*([\d.]+)ms/g)].map(([, v]) => parseFloat(v));
  assert.ok(all.length >= Object.keys(durations).length, 'chưa có token --motion-* dạng ms');
  assert.ok(all.every(value => value <= 300), `token vượt 300ms: ${all}`);
});
test('UX-13 motion tokens do not change with the dark theme', () => {
  assert.ok(read(light, 'motion-press'), 'chưa có --motion-press ở :root');
  assert.equal(/--motion-/.test(dark), false, 'khối dark không được khai báo lại --motion-*');
});
