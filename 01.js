const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = path.resolve(__dirname, 'path/to/your/video.mp4');

  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error('File not found:', err);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const { range } = req.headers;
    if (!range) {
      res.writeHead(416, { 'Content-Type': 'text/plain' });
      res.end('Range Not Satisfiable');
      return;
    }

    const positions = range.replace(/bytes=/, '').split('-');
    const start = parseInt(positions[0], 10);
    const end = positions[1] ? parseInt(positions[1], 10) : stats.size - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });

    const stream = fs.createReadStream(filePath, { start, end })
      .on('open', () => {
        stream.pipe(res);
      })
      .on('error', (err) => {
        console.error('Stream error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
