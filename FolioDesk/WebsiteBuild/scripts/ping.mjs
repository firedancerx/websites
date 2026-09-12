import http from 'http';

http.get('http://localhost:3000/login', (res) => {
  console.log(`Server responded with status code: ${res.statusCode}`);
  process.exit(0);
}).on('error', (err) => {
  console.error(`HTTP Connection Error: ${err.message}`);
  process.exit(1);
});
