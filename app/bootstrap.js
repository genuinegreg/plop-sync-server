/**
 * Created by greg on 15/11/13.
 */

'use strict';

var di = require('di');


var config = {
    server: {
        name: 'plop-sync-api'
    }
};

var bootstrapModule = {
    config: ['value', config],
    'server': ['type', require('./server').Server]
};


var injector = new di.Injector(
    [
        require('./server').ServerModule,
        bootstrapModule
    ]);

injector.invoke(function(server) {
    server.start();
});