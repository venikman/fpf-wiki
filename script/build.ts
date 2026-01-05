import { execSync } from 'child_process';

try {
  execSync('npx astro build', { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
