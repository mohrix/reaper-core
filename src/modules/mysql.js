const net = require('net');
const { withTimeout } = require('../core/utils');

function checkMySQL(ip, port) {
    return withTimeout(new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(port, ip);
        client.on('data', (data) => {
            client.destroy();
            if (data.toString('hex').includes('0a')) resolve({ status: "OPEN", details: "MySQL Handshake (Check brute)" });
            else resolve({ status: "Open", details: "Unknown Response" });
        });
        client.on('error', () => { client.destroy(); resolve(null); });
    }), 2000).catch(() => null);
}
module.exports = { checkMySQL };
