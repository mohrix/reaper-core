<div align="center">

# 🪓 REAPER CORE

**The Ultimate Network Reconnaissance & Exploitation Framework**

[![Version](https://img.shields.io/badge/version-4.0.0-brightgreen.svg?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-green.svg?style=for-the-badge)]()
[![Platform](https://img.shields.io/badge/Platform-Termux%20%7C%20Linux%20%7C%20Windows-lightgrey.svg?style=for-the-badge)]()

*Fast. Stealthy. Modular. Deadly.*

</div>

---

**REAPER CORE** is a lightning-fast, highly concurrent, and modular network reconnaissance framework built with Node.js. It is designed for security researchers, penetration testers, and network administrators to perform deep scans, detect vulnerabilities, and brute-force credentials across entire networks.

Stop using slow, single-threaded scanners. Reaper scans multiple IPs concurrently, fingerprints devices, and bypasses basic protections to give you the intelligence you need to strike precisely.

## 📑 Table of Contents
- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [🛠️ Advanced Flags](#️-advanced-flags)
- [🐳 Docker Support](#-docker-support)
- [⚠️ Disclaimer](#️-disclaimer)

---

## ✨ Features

- **⚡ Lightning Fast:** Scans multiple IPs and ports concurrently using `Promise.all`. A `/24` subnet takes minutes, not hours.
- **📱 Device Fingerprinting:** Automatically detects the target device type based on ports and banners (Android Phones, IP Cameras, Windows Servers, Linux Servers).
- **🎥 RTSP Camera Discovery:** Detects open cameras and automatically finds the valid stream path (Dahua, Hikvision, etc.).
- **💻 Deep Recon:** Grabs SSH versions, Windows RDP NLA status, and HTTP Server headers.
- **💀 Vulnerability Checks:** Identifies BlueKeep (CVE-2019-0708) on RDP and outdated SSH versions.
- **🔑 Bruteforce Engine:** Tests default credentials on HTTP login forms and FTP services.
- **🕸️ Subdomain Enumeration:** Discovers hidden subdomains (`admin`, `dev`, `vpn`) automatically.
- **📂 Directory Fuzzing:** Hunts for sensitive files like `/.env`, `/.git/config`, and `/backup.zip`.
- **💾 Export Options:** Save findings to a beautifully designed HTML report or JSON file.

---

## 📸 Screenshots

*(Upload your terminal screenshot here and replace this text)*
`<img src="https://via.placeholder.com/800x400/111318/00FF41?text=Reaper+Terminal+Output" alt="Terminal Output" width="100%">`

---

## 📦 Installation

### Option 1: Install via NPM (Recommended)
```bash
npm install -g @mohrix_dz/reaper
```

Option 2: Clone from GitHub (For Developers)

```bash
git clone https://github.com/mohrix/reaper-core.git
cd reaper-core
npm install
npm link
```

---

🚀 Usage

```bash
reaper <target> [options] [wordlist]
```

Basic Examples

1. Quick Port Scan (Fast):

```bash
reaper 192.168.1.100
```

2. Deep Scan (Service Version + Vulnerabilities + OSINT):

```bash
reaper -sV -vuln -geo -rdns 192.168.1.100
```

3. Scan a Whole Subnet & Save HTML Report:

```bash
reaper 192.168.1.0/24 -sV -r report.html
```

4. Brute-Force FTP & HTTP Login (Requires Wordlist at the end):

```bash
reaper -sV -b 192.168.1.100 /path/to/creds.txt
```

(Wordlist format: admin:password on each line)

5. Find Hidden Subdomains:

```bash
reaper example.com -s
```

---

🛠️ Advanced Flags

Flag Description
-sV, --service Probe service versions, grab banners, and detect device types.
-vuln, --vuln Check for known CVEs (BlueKeep, SSH).
-geo, --geo Fetch GeoIP information (Country, City, ISP).
-rdns, --rdns Fetch Reverse DNS for the target.
-f, --fuzz Enable web directory fuzzing (Finds .env, .git).
-b, --brute Enable brute-force on FTP/HTTP. (Requires [wordlist] argument).
-p, --ports Custom ports to scan (e.g., 80,443,554).
-s, --subdomains Enumerate subdomains (Works only with domains).
-r, --report Save results to a styled HTML report.
-o, --output Save results to a JSON file.
-t, --timeout Timeout per port in ms (Default: 1500). Use -t 6000 with Proxychains.

---

🐳 Docker Support

You can run Reaper in an isolated Docker container:

```bash
docker build -t reaper-core .
docker run --rm reaper-core -sV 192.168.1.100
```

---

⚠️ Disclaimer

This tool is intended for authorized security testing and educational purposes only. Do not use Reaper against targets you do not own or have explicit permission to test. The author assumes no liability for any misuse or damage caused by this tool.

---

<div align="center">
  <b>Built with 🖤 by <a href="https://github.com/mohrix">mohrix</a></b><br>
  <i>If this tool helped you, consider giving it a ⭐!</i>
</div>
