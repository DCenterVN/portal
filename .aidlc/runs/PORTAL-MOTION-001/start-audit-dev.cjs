// Codex chạy. Không cài package, sao chép .env hay in giá trị cấu hình.
const { createRequire } = require('node:module');
const { existsSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { resolve } = require('node:path');
const root = resolve(__dirname, '../../..');
const main = '/home/dawn/work/ticket/portal';
if (!existsSync(resolve(root, 'node_modules/next/dist/bin/next'))) {
  console.error('Worktree thiếu dependency Next. Script không cài package.');
  process.exit(1);
}
try {
  const installed = createRequire(resolve(root, 'package.json'));
  const nextRequire = createRequire(installed.resolve('next/package.json'));
  nextRequire('@next/env').loadEnvConfig(main, true, { info() {}, error() {} });
} catch {
  console.error('Không đọc được cấu hình Next từ portal gốc.');
  process.exit(1);
}
const child = spawn('pnpm', ['exec', 'next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', process.env.MOTION_PORT || '3000'], {
  cwd: root,
  env: { ...process.env, TMPDIR: '/home/dawn/work/ticket/.cache/tmp' },
  stdio: 'inherit',
});
child.on('error', () => { console.error('Không mở được pnpm dev.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
