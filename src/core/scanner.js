const net = require('net');
const { checkRTSP, checkRDP, checkSSH, getBanner } = require('../modules/recon');
const { getHttpInfo, webFuzz, bruteForceHttp, bruteForceFtp } = require('../modules/web');
const { checkRedis } = require('../modules/redis');
const { checkMySQL } = require('../modules/mysql');
const { testSqli } = require('../modules/sqli');

async function scanPort(ip, port, options, credsList) {
    let service = 'Unknown', details = 'Open', device = 'Unknown';
    
    if (!options.service && !options.vuln && !options.fuzz && !options.brute) {
        if ([80, 8080, 8081].includes(port)) service = 'HTTP'; 
        else if (port === 443) service = 'HTTPS'; 
        else if (port === 3389) service = 'RDP'; 
        else if (port === 22) service = 'SSH'; 
        else if (port === 554) service = 'RTSP';
        else if (port === 21) service = 'FTP';
        else if (port === 3306) service = 'MySQL';
        else if (port === 6379) service = 'Redis';
        else if (port === 5555) { service = 'ADB'; device = 'Android Phone/TV 📱'; }
        return { service, device, details };
    }

    if (port === 554) {
        service = 'RTSP'; const rtsp = await checkRTSP(ip);
        if (rtsp) { details = rtsp.status + " | " + rtsp.path; device = rtsp.device; }
    } else if ([80, 8080, 8081, 443].includes(port)) {
        service = port === 443 ? 'HTTPS' : 'HTTP';
        const web = await getHttpInfo(ip, port, port === 443);
        if (web) {
            details = '[' + web.status + '] ' + web.server + ' | ' + web.title; device = web.device;
            if (options.vuln) {
                const sqli = await testSqli(ip, port, port === 443);
                if (sqli) details += ' | ' + sqli.details;
            }
            if (options.fuzz) {
                const fuzzed = await webFuzz(ip, port, port === 443);
                if (fuzzed.length > 0) details += ' | Files: ' + fuzzed.join(',');
            }
            if (options.brute && web.isLogin && credsList.length > 0) {
                const creds = await bruteForceHttp(ip, port, port === 443, web.rawData, credsList);
                if (creds) details += ' | 🔑 ' + creds;
            }
        } else details = 'Open (No HTTP Response)';
    } else if (port === 3389) {
        service = 'RDP'; const rdp = await checkRDP(ip);
        details = rdp.status; device = rdp.device;
        if (options.vuln && rdp.status === "RDP Active") details += ' | 💀 BlueKeep Possible';
    } else if (port === 22) {
        service = 'SSH'; const ssh = await checkSSH(ip);
        if (ssh) { details = ssh.banner; device = ssh.device; if (options.vuln && ssh.vuln) details += ' | 💀 ' + ssh.vuln; }
    } else if (port === 5555) {
        service = 'ADB'; device = 'Android Phone/TV 📱'; details = 'Android Debug Bridge Open!';
    } else if (port === 6379) {
        service = 'Redis'; const r = await checkRedis(ip, port);
        if (r) details = r.details;
    } else if (port === 3306) {
        service = 'MySQL'; const m = await checkMySQL(ip, port);
        if (m) details = m.details;
    } else if (port === 21) {
        service = 'FTP'; const banner = await getBanner(ip, port);
        if (banner) details = banner;
        if (options.brute && credsList.length > 0) {
            const ftpCreds = await bruteForceFtp(ip, credsList);
            if (ftpCreds) details += ' | 🔑 ' + ftpCreds;
        }
    }
    return { service, device, details };
}

module.exports = { scanPort };
