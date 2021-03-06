const path = require('path');
const http = require('http');
const cron = require('node-cron');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');
const instagram = require('./instagram');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const mongoose = require('./mongoose');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.configure(mongoose);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);
// Set up instagram client
app.configure(instagram);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

(async() => {
  try {
    await app.service('bootstrap').init();
  } catch (e) {
    console.log(e);
  }
})();



if (process.env.NODE_ENV === 'production') {
  cron.schedule('*/5 * * * *', () => {
    console.log('Keepalive');
    http.get('http://szupermaszat.herokuapp.com');
  });
  /* setInterval(() => {
    console.log('Keepalive');
    http.get('http://szupermaszat.herokuapp.com');
  }, 30000); */
}

module.exports = app;
