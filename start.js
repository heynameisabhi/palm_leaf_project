const { execSync } = require('child_process');
execSync('npm run dev:all', { stdio: 'inherit' });
