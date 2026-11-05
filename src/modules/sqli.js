const http = require('http');
const https = require('https');
const { withTimeout } = require('../core/utils');

function testSqli(ip, port, isHttps = false) {
    return withTimeout(new Promise((resolve) => {
        const client = isHttps ? https : http;
        const req = client.get({ host: ip, port: port, path: "/?id='", rejectUnauthorized: false }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const dbErrors = /SQL syntax|mysql_|ORA-[0-9]|PostgreSQL/i;
                if (dbErrors.test(data)) resolve({ status: "VULNERABLE", details: "💀 Error-Based SQLi Found" });
                else resolve(null);
            });
        });
        req.on('error', () => resolve(null));
    }), 3000).catch(() => null);
}
module.exports = { testSqli };

