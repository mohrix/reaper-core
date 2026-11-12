const net = require('net');
const dns = require('dns');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const { checkPort, expandTargets, runWithConcurrency } = require('./utils');
const { getGeoIP, getReverseDNS } = require('./osint');
const { scanPort } = require('./scanner');
const { generateHtmlReport, displayTable } = require('../utils/reporter');

const DEFAULT_PORTS = [21, 22, 23, 80, 443, 3389, 3306, 5432, 554, 5555, 6379, 8080, 8081];

const SCAN_MODES = {
    rdp: { label: 'RDP', ports: [3389] },
    cam: { label: 'RTSP', ports: [554] },
    web: { label: 'HTTP/HTTPS', ports: [80, 443, 8080, 8081] },
    adb: { label: 'ADB', ports: [5555] },
};

function resolveScanMode(options) {
    return Object.keys(SCAN_MODES).find((mode) => options[mode]) || null;
}

async function runScan(target, wordlist, options) {
    let credsList = [];
    if (wordlist) {
        try {
            const content = fs.readFileSync(wordlist, 'utf8');
            credsList = content.split('\n').map(l => l.trim()).filter(l => l && l.includes(':'));
            console.log(chalk.cyan(`[*] Loaded ${credsList.length} credentials.`));
        } catch (e) { console.log(chalk.red(`[-] Could not read wordlist.`)); }
    }

    let targets = [];
    if (!net.isIP(target) && !target.includes('/') && !target.includes('-')) {
        const spinner = ora(`Resolving ${target}...`).start();
        const address = await new Promise(res => dns.lookup(target, (err, addr) => res(err ? null : addr)));
        if (!address) { spinner.fail('Resolution failed.'); return; }
        spinner.succeed(`Resolved to ${address}`);
        targets = [address];
    } else {
        targets = expandTargets(target);
    }

    console.log(chalk.magenta(`[*] Total Targets: ${targets.length}`));

    const activeMode = resolveScanMode(options);
    const modeConfig = activeMode ? SCAN_MODES[activeMode] : null;
    let portsToScan = DEFAULT_PORTS.slice();

    if (modeConfig) {
        if (options.ports) {
            console.log(chalk.yellow(`[!] Ignoring -p: ${activeMode} mode only scans port(s) ${modeConfig.ports.join(',')}.`));
        }
        portsToScan = modeConfig.ports.slice();
        console.log(chalk.cyan(`[*] Target mode: ${modeConfig.label} only — port(s) ${portsToScan.join(',')}`));
    } else if (options.ports) {
        portsToScan = options.ports.split(',').map(Number);
    }

    const scanOptions = modeConfig
        ? { ...options, mode: activeMode, forcedPorts: portsToScan.slice() }
        : options;

    const scanTasks = targets.map(ip => async () => {
        const open = [];
        const scanPromises = portsToScan.map(p => checkPort(ip, p, parseInt(scanOptions.timeout)));
        const results = await Promise.all(scanPromises);
        results.forEach(p => { if (p) open.push(p); });
        return { ip, open };
    });

    const spinner = ora(`Scanning with speed...`).start();
    const scanResults = await runWithConcurrency(scanTasks, 50);
    spinner.stop();

    const finalResults = {};

    for (const res of scanResults) {
        if (res.status !== 'fulfilled') continue;

        const { ip, open } = res.value;
        if (open.length === 0) {
            if (modeConfig) console.log(chalk.yellow(`[-] No ${modeConfig.label} service found on ${ip}`));
            continue;
        }

        const hostResults = {};
        if (scanOptions.geo) { const geo = await getGeoIP(ip); if (geo) hostResults.geo = geo; }
        if (scanOptions.rdns) { const rdns = await getReverseDNS(ip); if (rdns) hostResults.reverse_dns = rdns; }

        for (const port of open) {
            const result = await scanPort(ip, port, scanOptions, credsList);
            if (result) hostResults[port] = result;
        }

        const serviceEntries = Object.keys(hostResults).filter(key => key !== 'geo' && key !== 'reverse_dns');
        if (serviceEntries.length > 0) finalResults[ip] = hostResults;
    }

    displayTable(finalResults);
    if (options.output) fs.writeFileSync(options.output, JSON.stringify(finalResults, null, 2));
    if (options.report) { generateHtmlReport(finalResults, options.report); console.log(chalk.green(`\n[+] Report saved to ${options.report}`)); }
}

module.exports = { runScan };
