const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '..', 'client', 'dist');
function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};
module.exports = (req, res) => {
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/api/health' || urlPath === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  let filePath = path.join(distPath, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  if (!ext || !fs.existsSync(filePath)) {
    filePath = path.join(distPath, 'index.html');
  }
  sendFile(res, filePath, mime[path.extname(filePath)] || 'text/html');
};
