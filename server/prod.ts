import { spawn } from 'child_process';

const astro = spawn('npx', ['astro', 'preview', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  shell: true,
});

astro.on('close', (code) => {
  process.exit(code ?? 0);
});
