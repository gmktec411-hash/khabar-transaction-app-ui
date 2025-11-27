const localtunnel = require('localtunnel');

(async () => {
  const t1 = await localtunnel({ port: 3000, subdomain: 'myreactdemo' });
  console.log('React URL:', t1.url);
  const t2 = await localtunnel({ port: 8080, subdomain: 'myspringapi' });
  console.log('Spring URL:', t2.url);

  process.on('SIGINT', async () => {
    await t1.close(); await t2.close(); process.exit();
  });
})();
