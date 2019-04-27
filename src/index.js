#!/usr/bin/env node
var app = require('./app');
var config = require('./config');

app.set('port', config.port);

if (config.ssl) {
  // Run HTTPS server
  require('https').createServer(config.ssl, app).listen(config.port, function() {
    console.info('Server running at https://localhost:' + config.port);
  });
}
else {
  // Run HTTP server
  app.listen(app.get('port'), function() {
    console.info('Server running at http://localhost:' + config.port);
  });
}
