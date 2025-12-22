// This script injects environment variables at build time
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'client', 'config.js');
const serverUrl = process.env.SERVER_URL || null;

const configContent = `// Configuration for server URL
// Auto-generated at build time
window.CONFIG = {
    SERVER_URL: ${serverUrl ? `"${serverUrl}"` : 'null'} // Will be injected at runtime via Vercel
};
`;

fs.writeFileSync(configPath, configContent);
console.log('Config file generated with SERVER_URL:', serverUrl || 'null (using auto-detect)');

