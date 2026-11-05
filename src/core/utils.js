const net = require('net');

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
}

function expandTargets(input) {
    if (input.includes('/')) {
        const [ip, mask] = input.split('/');
        if (parseInt(mask) < 24) return [ip];
        const parts = ip.split('.').map(Number);
        const targets = [];
        for (let i = 1; i < 255; i++) targets.push(`${parts[0]}.${parts[1]}.${parts[2]}.${i}`);
        return targets;
    }
    if (input.includes('-')) {
        const [start, end] = input.split('-');
        const startParts = start.split('.').map(Number);
        const endVal = parseInt(end);
        const targets = [];
        for (let i = startParts[3]; i <= endVal; i++) targets.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
        return targets;
    }
    return [input];
}

function checkPort(ip, port, timeout = 1500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;
        const timer = setTimeout(() => { if (!resolved) { resolved = true; socket.destroy(); resolve(null); } }, timeout);
        socket.connect(port, ip, () => { if (!resolved) { resolved = true; clearTimeout(timer); socket.destroy(); resolve(port); } });
        socket.on('error', () => { if (!resolved) { resolved = true; clearTimeout(timer); socket.destroy(); resolve(null); } });
    });
}

async function runWithConcurrency(tasks, limit) {
    const results = [];
    const executing = new Set();
    for (const task of tasks) {
        const p = Promise.resolve().then(() => task());
        results.push(p); executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        if (executing.size >= limit) await Promise.race(executing);
    }
    return Promise.allSettled(results);
}

module.exports = { withTimeout, expandTargets, checkPort, runWithConcurrency };
