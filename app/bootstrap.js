/**
 * Created by greg on 15/11/13.
 */

'use strict';
require('colors');
var assert = require('assert-plus');
var di = require('di');


var opt = require('node-getopt').create([

        ['', 'db-host=', 'Database host'],
        ['', 'db-name=', 'Database name'],
        ['', 'mail-host=', 'Smtp host'],
        ['', 'mail-user=', 'Smtp user'],
        ['', 'mail-pwd=', 'Smtp password'],
        ['h', 'help', 'Display help']
    ])
    .bindHelp()
    .parseSystem();


var config = {
    server: {
        name: 'plop-sync-api'
    },
    database: {
        host: opt.options['db-host'] || '127.0.0.1',
        name: opt.options['db-name'] || 'default'
    },
    session: {
        tokenStrength: 64
    },
    bcrypt: {
        strength: 10
    },
    mailer: {
        user: opt.options['mail-user'] || undefined,
        password: opt.options['mail-pwd'] || undefined,
        host: opt.options['mail-host'] || undefined
    }
};


var bootstrapModule = {
    config: ['value', config]
};


var injector = new di.Injector(
    [
        require('./server'),
        require('./lib/routes'),
        require('./lib/accessControlMiddleware'),
        require('./lib/schema'),
        require('./lib/docker'),
        require('./lib/bittorrentSync'),
        require('./lib/mailer'),
        bootstrapModule
    ]);

injector.invoke(function(server) {
    server.start();
});