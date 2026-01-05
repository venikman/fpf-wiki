import { spawn } from 'child_process';

const astro = spawn('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
});

astro.on('close', (code) => {
  process.exit(code ?? 0);
});
