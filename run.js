#!/usr/bin/node

process.env.DB_HOST = '172.17.0.42';
process.env.DB_NAME = 'plop-sync';

require('./app/server.js');
