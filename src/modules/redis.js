const net = require('net');
const { withTimeout } = require('../core/utils');

function checkRedis(ip, port) {
    return withTimeout(new Promise((resolve) => {
        const client = new net.Socket();
        client.setTimeout(3000);
        client.connect(port, ip, () => client.write('PING\r\n'));
        client.on('data', (data) => {
            client.destroy();
            if (data.toString().includes('PONG')) resolve({ status: "OPEN", details: "💀 No Auth (PONG)" });
            else resolve({ status: "AUTH", details: "Requires Password" });
        });
        client.on('error', (err) => { client.destroy(); resolve(null); });
        client.on('timeout', () => { client.destroy(); resolve(null); });
    }), 2000).catch(() => null);
}
module.exports = { checkRedis };
