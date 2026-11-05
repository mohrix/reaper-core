const Table = require('cli-table3');
const chalk = require('chalk');
const fs = require('fs');

function displayTable(finalResults) {
    const table = new Table({ head: [chalk.cyan('IP'), chalk.cyan('Port'), chalk.cyan('Service'), chalk.cyan('Device'), chalk.cyan('Details')], colWidths: [16, 8, 10, 18, 50] });
    for (const [ip, data] of Object.entries(finalResults)) {
        for (const [port, info] of Object.entries(data)) {
            if (port === 'geo' || port === 'reverse_dns') continue;
            table.push([ip, port, info.service, chalk.yellow(info.device), info.details]);
        }
    }
    if (table.length > 0) console.log(table.toString());
    else console.log(chalk.red("\\n[-] No open ports found."));
}

function generateHtmlReport(finalResults, filename) {
    let targetBlocks = '';
    for (const [ip, data] of Object.entries(finalResults)) {
        let rows = '';
        for (const [port, info] of Object.entries(data)) {
            if (port === 'geo' || port === 'reverse_dns') continue;
            rows += \`<tr><td>\${port}</td><td>\${info.service}</td><td>\${info.device}</td><td>\${info.details}</td></tr>\`;
        }
        targetBlocks += \`<div class="card"><h2>🎯 \${ip}</h2><p>\${data['geo'] || ''} | \${data['reverse_dns'] || ''}</p><table><thead><tr><th>Port</th><th>Service</th><th>Device</th><th>Details</th></tr></thead><tbody>\${rows}</tbody></table></div>\`;
    }
    const html = \`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>REAPER Report</title>
    <style>body{background:#050505;color:#E0E0E0;font-family:sans-serif;padding:20px;} .card{background:#111318;border:1px solid #2A303C;border-radius:8px;padding:15px;margin-bottom:20px;} h2{color:#00FF41;} table{width:100%;border-collapse:collapse;} th,td{padding:10px;border-bottom:1px solid #2A303C;text-align:left;} th{color:#00E5FF;}</style>
    </head><body><h1 style="text-align:center;color:#00E5FF">🪓 REAPER REPORT</h1>\${targetBlocks}</body></html>\`;
    fs.writeFileSync(filename, html);
}

module.exports = { displayTable, generateHtmlReport };
