const { checkRTSP, checkRDP, checkSSH, getBanner } = require('../modules/recon');
const { getHttpInfo, webFuzz, bruteForceHttp, bruteForceFtp } = require('../modules/web');
const { checkRedis } = require('../modules/redis');
const { checkMySQL } = require('../modules/mysql');
const { testSqli } = require('../modules/sqli');

async function scanRdp(ip, port, options) {
    const rdp = await checkRDP(ip);
    if (!rdp) return { service: 'RDP', device: 'Unknown', details: 'Open (No RDP Response)' };

    let details = rdp.status;
    if (options.vuln && rdp.status === 'RDP Active') details += ' | 💀 BlueKeep Possible';

    return { service: 'RDP', device: rdp.device, details };
}

async function scanRtsp(ip) {
    const rtsp = await checkRTSP(ip);
    if (!rtsp) return { service: 'RTSP', device: 'Unknown', details: 'Open' };

    return { service: 'RTSP', device: rtsp.device, details: rtsp.status + ' | ' + rtsp.path };
}

async function scanWeb(ip, port, options, credsList) {
    const service = port === 443 ? 'HTTPS' : 'HTTP';
    const web = await getHttpInfo(ip, port, port === 443);
    if (!web) return { service, device: 'Unknown', details: 'Open (No HTTP Response)' };

    let details = '[' + web.status + '] ' + web.server + ' | ' + web.title;

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

    return { service, device: web.device, details };
}

function scanAdb() {
    return { service: 'ADB', device: 'Android Phone/TV 📱', details: 'Android Debug Bridge Open!' };
}

const MODE_SCANNERS = {
    rdp: scanRdp,
    cam: scanRtsp,
    web: scanWeb,
    adb: scanAdb,
};

async function scanPort(ip, port, options, credsList) {
    if (options.mode) {
        const scanner = MODE_SCANNERS[options.mode];
        const allowedPorts = options.forcedPorts || [];
        if (!scanner || !allowedPorts.includes(port)) return null;
        return scanner(ip, port, options, credsList);
    }

    if (!options.service && !options.vuln && !options.fuzz && !options.brute) {
        let service = 'Unknown', device = 'Unknown', details = 'Open';

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

    if (port === 554) return scanRtsp(ip, port, options, credsList);
    if ([80, 443, 8080, 8081].includes(port)) return scanWeb(ip, port, options, credsList);
    if (port === 3389) return scanRdp(ip, port, options);
    if (port === 5555) return scanAdb();

    if (port === 22) {
        const ssh = await checkSSH(ip);
        if (ssh) {
            let details = ssh.banner;
            if (options.vuln && ssh.vuln) details += ' | 💀 ' + ssh.vuln;
            return { service: 'SSH', device: ssh.device, details };
        }
        return { service: 'SSH', device: 'Unknown', details: 'Open' };
    }

    if (port === 6379) {
        const redis = await checkRedis(ip, port);
        return { service: 'Redis', device: 'Unknown', details: redis ? redis.details : 'Open' };
    }

    if (port === 3306) {
        const mysql = await checkMySQL(ip, port);
        return { service: 'MySQL', device: 'Unknown', details: mysql ? mysql.details : 'Open' };
    }

    if (port === 21) {
        let details = 'Open';
        const banner = await getBanner(ip, port);
        if (banner) details = banner;
        if (options.brute && credsList.length > 0) {
            const ftpCreds = await bruteForceFtp(ip, credsList);
            if (ftpCreds) details += ' | 🔑 ' + ftpCreds;
        }
        return { service: 'FTP', device: 'Unknown', details };
    }

    return { service: 'Unknown', device: 'Unknown', details: 'Open' };
}

module.exports = { scanPort };
