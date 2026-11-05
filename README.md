# 🪓 REAPER CORE
**Ultimate Network Reconnaissance & Exploitation Framework**

REAPER is a lightning-fast, modular, and highly concurrent network reconnaissance framework built with Node.js. It is designed for security researchers and penetration testers to perform deep scans, detect vulnerabilities, and brute-force credentials.

## 🚀 Features
- **Lightning Fast:** Scans entire subnets concurrently.
- **Device Fingerprinting:** Detects Android Phones, IP Cameras, Windows Servers, and more.
- **Deep Recon:** Grabs banners, SSH versions, and RTSP camera paths.
- **Vulnerability Checks:** Identifies BlueKeep (RDP) and outdated SSH versions.
- **Web Fuzzing & Brute-Force:** Finds sensitive files and tests default credentials.

## 📦 Installation
```bash
git clone https://github.com/yourusername/reaper-core.git
cd reaper-core
npm install
npm link
```

🛠️ Usage

```bash
reaper <target> [options]
```

Examples

· Quick Scan: reaper 192.168.1.1
· Deep Scan (OSINT + Vulns): reaper -sV -vuln -geo -rdns 192.168.1.1
· Subnet Scan with Report: reaper 192.168.1.0/24 -r report.html
· Brute Force (FTP/HTTP): reaper -sV -b 192.168.1.1 creds.txt
  EOF
12. GitHub Actions (CI/CD)

cat << 'EOF' > .github/workflows/publish.yml
name: Publish to NPM
on:
release:
types: [created]
jobs:
build:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
with:
node-version: 18
registry-url: 'https://registry.npmjs.org'
- run: npm install
- run: npm publish --access public
env:
NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
