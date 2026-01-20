const app = require('./api/index');

const PORT = process.env.PORT || 3001;

if (app && typeof app.listen === 'function') {
  app.listen(PORT, () => {
    console.log(`Local test server listening on http://localhost:${PORT}`);
  });
} else {
  console.error('Could not load Express app from ./api/index');
  process.exit(1);
}
