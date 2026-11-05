const net = require('net');
const dns = require('dns');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const { checkPort, expandTargets, runWithConcurrency } = require('./utils');
const { getGeoIP, getReverseDNS } = require('./osint');
const { scanPort } = require('./scanner');
const { generateHtmlReport, displayTable } = require('../utils/reporter');

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
    
    let portsToScan = [21, 22, 23, 80, 443, 3389, 3306, 5432, 554, 5555, 6379, 8080, 8081];
    if (options.ports) {
        portsToScan = options.ports.split(',').map(Number);
    }

    const scanTasks = targets.map(ip => async () => {
        const open = [];
        const scanPromises = portsToScan.map(p => checkPort(ip, p, parseInt(options.timeout)));
        const results = await Promise.all(scanPromises);
        results.forEach(p => { if (p) open.push(p); });
        return { ip, open };
    });

    const spinner = ora(`Scanning with speed...`).start();
    const scanResults = await runWithConcurrency(scanTasks, 50);
    spinner.stop();

    const finalResults = {};

    for (const res of scanResults) {
        if (res.status !== 'fulfilled' || res.value.open.length === 0) continue;
        const { ip, open } = res.value;
        finalResults[ip] = {};

        if (options.geo) { const geo = await getGeoIP(ip); if (geo) finalResults[ip]['geo'] = geo; }
        if (options.rdns) { const rdns = await getReverseDNS(ip); if (rdns) finalResults[ip]['reverse_dns'] = rdns; }

        for (const port of open) {
            const result = await scanPort(ip, port, options, credsList);
            finalResults[ip][port] = result;
        }
    }

    displayTable(finalResults);
    if (options.output) fs.writeFileSync(options.output, JSON.stringify(finalResults, null, 2));
    if (options.report) { generateHtmlReport(finalResults, options.report); console.log(chalk.green(`\\n[+] Report saved to ${options.report}`)); }
}

module.exports = { runScan };
