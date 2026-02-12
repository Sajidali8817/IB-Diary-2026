const https = require('https');

const API_KEY = 'AIzaSyCtJ9EEFx6_ywymAOwpQd6v9FTX951YpGE';

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(' - ' + m.name));
            } else {
                console.log('No models found in response:', data);
            }
        } catch (e) {
            console.log('Error parsing JSON:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.end();
