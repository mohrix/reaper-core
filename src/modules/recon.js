const net = require('net');
const { withTimeout } = require('../core/utils');

const RTSP_PATHS = ["/cam/realmonitor?channel=1&subtype=0", "/h264/ch1/main/av_stream", "/11", "/live/ch0"];
const RDP_NEG_REQ = Buffer.from("030000130ee000000000000100080000000000", "hex");

function checkRTSP(ip) {
    return new Promise(async (resolve) => {
        const promises = RTSP_PATHS.map(path => {
            return withTimeout(new Promise((res) => {
                const client = new net.Socket();
                const req = \`DESCRIBE rtsp://\${ip}:554\${path} RTSP/1.0\\r\\nCSeq: 1\\r\\n\\r\\n\`;
                client.connect(554, ip, () => client.write(req));
                let data = '';
                client.on('data', (chunk) => { data += chunk.toString(); });
                client.on('close', () => {
                    if (data.includes("200 OK")) res({ status: "OPEN 🔥", path, device: "IP Camera 🎥" });
                    else if (data.includes("401 Unauthorized")) res({ status: "AUTH 🔑", path, device: "IP Camera 🎥" });
                    else res(null);
                });
                client.on('error', () => { client.destroy(); res(null); });
            }), 1500).catch(() => null);
        });
        const results = await Promise.all(promises);
        resolve(results.find(r => r !== null));
    });
}

function checkRDP(ip) {
    return withTimeout(new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(3389, ip, () => client.write(RDP_NEG_REQ));
        let data = Buffer.alloc(0);
        client.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
        client.on('close', () => {
            if (data.length > 11 && data[0] === 0x03 && data[5] === 0xD0) {
                resolve({ status: data.includes(Buffer.from("02000800", "hex")) ? "NLA Required" : "RDP Active", device: "Windows Server 🖥️" });
            } else resolve({ status: "RDP Open", device: "Windows Server 🖥️" });
        });
        client.on('error', () => { client.destroy(); resolve({ status: "Error", device: "Unknown" }); });
    }), 2500).catch(() => ({ status: "Timeout", device: "Unknown" }));
}

function checkSSH(ip) {
    return withTimeout(new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(22, ip);
        client.on('data', (data) => {
            client.destroy();
            const banner = data.toString().trim();
            let vuln = ""; let device = "Linux/Unix Server 🐧";
            if (banner.includes("OpenSSH_6.") || banner.includes("OpenSSH_7.2")) vuln = "Potential CVE";
            resolve({ banner, vuln, device });
        });
        client.on('error', () => { client.destroy(); resolve(null); });
    }), 2000).catch(() => null);
}

function getBanner(ip, port) {
    return withTimeout(new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(port, ip);
        client.on('data', (data) => { client.destroy(); resolve(data.toString().trim().substring(0, 60)); });
        client.on('error', () => { client.destroy(); resolve(null); });
    }), 2000).catch(() => null);
}

module.exports = { checkRTSP, checkRDP, checkSSH, getBanner };
