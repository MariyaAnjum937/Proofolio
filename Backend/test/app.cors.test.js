const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('CORS preflight reflects only explicitly allowed origins', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const { port } = server.address();
    const allowedOrigins = [
      'http://localhost:5173',
      'https://proofolio-liart.vercel.app',
    ];

    for (const origin of allowedOrigins) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/sign-in`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });

      assert.equal(response.status, 204);
      assert.equal(response.headers.get('access-control-allow-origin'), origin);
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
      assert.match(response.headers.get('access-control-allow-methods'), /POST/);
    }

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/sign-in`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://unapproved.example',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.equal(response.headers.has('access-control-allow-origin'), false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
