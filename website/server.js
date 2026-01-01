const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const API_HOST = 'localhost';
const API_PORT = 3000;

const server = http.createServer((req, res) => {
    // API Proxy
    if (req.url.startsWith('/darija-translator-service')) {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: req.url.replace('/darija-translator-service', ''),
            method: req.method,
            headers: req.headers
        };

        const proxyReq = http.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        req.pipe(proxyReq);

        proxyReq.on('error', (e) => {
            console.error('Proxy Error:', e.message);
            res.writeHead(502);
            res.end('Bad Gateway: ' + e.message);
        });
        return;
    }

    // Static File Serving - resolve from website directory
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Proxying api to http://${API_HOST}:${API_PORT}/`);
    require('child_process').exec(`start http://localhost:${PORT}`);
});
