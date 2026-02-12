const https = require('https');

const urls = [
    'https://ibnotes.abisexport.com/auth/login',
    'https://ibnotes.abisexport.com/api/auth/login'
];

urls.forEach(url => {
    console.log(`Checking ${url}...`);
    const req = https.request(url, { method: 'POST', timeout: 5000 }, (res) => {
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.statusCode}`);
        res.on('data', () => { }); // consume data
    });

    req.on('error', (e) => {
        console.error(`Error checking ${url}: ${e.message}`);
    });

    req.on('timeout', () => {
        console.error(`Timeout checking ${url}`);
        req.destroy();
    });

    req.end();
});
