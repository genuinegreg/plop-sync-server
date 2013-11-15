/**
 * Created by greg on 15/11/13.
 */

'use strict';
var assert = require('assert-plus');
var di = require('di');


assert.string(process.env.DB_HOST, 'DB_HOST env');
assert.string(process.env.DB_NAME, 'DB_NAME  env');


var config = {
    server: {
        name: 'plop-sync-api'
    },
    database: {
        host: process.env.DB_HOST,
        name: process.env.DB_NAME
    },
    session: {
        tokenStrength: 64
    },
    bcrypt: {
        strength: 10
    }
};

var bootstrapModule = {
    config: ['value', config],
    'server': ['type', require('./server').Server]
};


var injector = new di.Injector(
    [
        require('./server').ServerModule,
        require('./lib/schema').SchemaModule,
        bootstrapModule
    ]);

injector.invoke(function(server) {
    server.start();
});