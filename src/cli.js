const { program, Option } = require('commander');
const chalk = require('chalk');
const { runScan } = require('./core/engine');

program
    .name('reaper')
    .description('Ultimate Network Reconnaissance & Exploitation Framework')
    .version('4.0.0')
    .argument('<target>', 'IP, Domain, CIDR, or Range')
    .argument('[wordlist]', 'Path to brute-force wordlist (user:pass)')
    .option('-p, --ports <ports>', 'Custom ports (e.g., 80,443)')
    .option('-sV, --service', 'Probe service versions & Detect Devices')
    .option('-vuln, --vuln', 'Check for known vulnerabilities')
    .option('-f, --fuzz', 'Directory fuzzing')
    .option('-b, --brute', 'Enable brute force (requires wordlist)')
    .option('-geo, --geo', 'Get GeoIP information')
    .option('-rdns, --rdns', 'Get Reverse DNS')
    .option('-s, --subdomains', 'Enumerate subdomains')
    .option('-r, --report <file>', 'Save HTML report')
    .option('-o, --output <file>', 'Save JSON output')
    .option('-t, --timeout <ms>', 'Timeout per port in ms', '1500')
    .addOption(
        new Option('-rdp, --rdp', 'Target mode: RDP assessment only (port 3389)')
            .conflicts(['cam', 'web', 'adb'])
    )
    .addOption(
        new Option('-cam, --cam', 'Target mode: IP camera RTSP path discovery only (port 554)')
            .conflicts(['rdp', 'web', 'adb'])
    )
    .addOption(
        new Option('-web, --web', 'Target mode: HTTP/HTTPS assessment only (ports 80,443,8080,8081)')
            .conflicts(['rdp', 'cam', 'adb'])
    )
    .addOption(
        new Option('-adb, --adb', 'Target mode: Android ADB assessment only (port 5555)')
            .conflicts(['rdp', 'cam', 'web'])
    )
    .action(async (target, wordlist, options) => {
        console.log(chalk.cyan(`
    ╔══════════════════════════════════════╗
    ║        REAPER CORE - v4.0.0          ║
    ║     Ultimate Recon Framework         ║
    ╚══════════════════════════════════════╝
        `));
        await runScan(target, wordlist, options);
    });

program.parse();
