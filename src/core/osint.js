const http = require('http');
const dns = require('dns');
const { withTimeout } = require('./utils');

function getGeoIP(ip) {
    return withTimeout(new Promise((resolve) => {
        http.get(\`http://ip-api.com/json/\${ip}\`, (res) => {
            let data = ''; res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { const json = JSON.parse(data); resolve(json.status === 'success' ? \`\${json.country} | \${json.city} | \${json.isp}\` : null); } catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    }), 3000).catch(() => null);
}

function getReverseDNS(ip) {
    return new Promise((resolve) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err || hostnames.length === 0) resolve(null); else resolve(hostnames.join(', '));
        });
    });
}

module.exports = { getGeoIP, getReverseDNS };
