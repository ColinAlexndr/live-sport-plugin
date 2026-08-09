# 🔴 Nuvio Live Sports Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-brightgreen.svg)](#)

## 📖 Description
A production-grade live sports streaming add-on for [Nuvio](https://nuvio.tv) and [Stremio](https://www.stremio.com/). It serves as a powerful multi-source aggregator that provides native live sports streams (Football, Basketball, Motorsport, Cricket, and more) inside your client, utilizing an advanced internal stream resolver to bypass CORS restrictions.

---

## 🛑 WHY YOU MUST SELF-HOST THIS ADDON

This add-on is designed to be **self-hosted** by users. If you try to host a single public instance for thousands of users, **it will fail**. Here is why:

1. **IP Bans (Crucial):** If 1,000 people use a single public link, the streaming sites (like Streamed.pk) will see 1,000 requests coming from your single server IP address. They will assume it's a bot attack and permanently ban your server IP. **If everyone self-hosts, the requests come from their own unique home IP addresses, making it impossible for providers to block them.**
2. **Memory Crashes:** Free hosting providers usually offer 100MB-500MB of RAM. Proxying video streams requires memory buffering. A central server will quickly run out of RAM and crash in a loop.
3. **Bandwidth Bills:** Proxying live video streams uses a *massive* amount of internet bandwidth. A central server will burn through terabytes of data in days, and hosting companies will shut you down or charge you huge fees. Self-hosting uses your own home internet data.

**Do not distribute a single public link to your users. Distribute this repository and instruct them to self-host.**

---

## ✨ Key Features
- **🏟️ Multi-Source Aggregator:** Combines matches and streams from multiple sources into a unified catalog.
- **⚡ Background Cron Caching:** Uses Stale-While-Revalidate (SWR) caching with an internal background Cron Service to ensure instant loading without hammering provider APIs.
- **🛡️ Opossum Circuit Breakers:** Provider requests are isolated via circuit breakers to instantly fail-over if a streaming site goes down.
- **🌐 Built-in Stream Resolver:** Spawns a secondary proxy process (`resolver`) to bypass CORS and referrer restrictions natively.
- **⚙️ Dynamic Configuration:** Features a beautiful local configuration page to curate your favorite sports and teams.

## 🚀 Installation & Self-Hosting Guide

### Option 1: Local PC / Raspberry Pi (Recommended)
Hosting on your own computer or Raspberry Pi is the best option because it uses your home IP address, which streaming sites will never block.

**Prerequisites:** Node.js (v22 or higher)

1. Clone the repository:
   ```bash
   git clone https://github.com/rajhodedara/live-sport-plugin.git
   cd live-sport-plugin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the addon:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:7000`. Configure your sports, and click **Install Addon**.

### Option 2: Deploying to Alwaysdata (Free Cloud)
Alwaysdata offers a completely free 100MB tier without a credit card. While 100MB is very strict, we have highly optimized this app to run on it for personal use (1-2 users).

1. Sign up for a free account at [Alwaysdata](https://www.alwaysdata.com/).
2. In your Alwaysdata dashboard, go to **Sites** -> **Add a new site**.
3. Under **Type**, choose **Node.js**.
4. Set the **Node.js version** to `22` or `24`.
5. Connect your GitHub repository, or upload the files via FTP/SSH.
6. **CRITICAL:** Set the startup command to:
   ```bash
   node --max-old-space-size=70 dist/index.js
   ```
   *(The `--max-old-space-size=70` flag is required so Node.js garbage collector triggers early, preventing the strict 100MB Alwaysdata limit from instantly killing your app (`SIGKILL 137`)).*
7. Go to the public URL provided by Alwaysdata, configure your sports, and install it into Stremio/Nuvio!

### Option 3: Other Free Cloud Platforms
If you have a credit card for verification, or find other free hosts, you can deploy this app as a standard Node.js web service. We recommend a host with at least **512MB RAM** for a completely stable experience (e.g., Koyeb, Render, Railway, Serv00).

---

## 🎛️ Configuration Options
Through the local `/configure` UI, you can append a base64/URI-encoded configuration object to the addon URL:
- **sports:** Comma-separated list of enabled sports categories (e.g., `football,basketball,cricket`). Defaults to `all`.
- **teams:** Comma-separated list of favorite teams (e.g., `Arsenal,Lakers`). These populate the "⭐ Your Teams" catalog.

## 🏗️ Architecture Overview
1. **Frontend Proxy:** An Express server (`src/index.js`) handles Stremio catalog, meta, and stream requests. It also dynamically rewrites URLs to ensure remote hosting compatibility.
2. **Cron Cache Service:** Instead of scraping on-demand, a background cron job periodically fetches and merges events from multiple APIs, storing them in memory.
3. **Internal Resolver:** The main process spawns a child `node` process (`resolver/src/server.js`) that acts as a reverse proxy for HLS chunks (`/api/hls`).

## 📄 License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - for educational and personal use only.
