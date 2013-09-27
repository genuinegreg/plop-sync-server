"use strict";


var restify = require('restify');

var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'myapp',
    streams: [
        {
            level: 'info',
            path: './btsync-saas.log',       // log INFO and above to btsync-saas.log
            stream: process.stdout
        },
        {
            level: 'error',
            path: './btsync-saas-error.log'  // log ERROR and above to btsync-saas-error.log
        }
    ]
});


// require libs
var route = require('./lib/routes');

var access = require('./lib/accessControlMiddleware');


var server = restify.createServer({
    name: 'btsync-saas',
    log: log

});


// parse http basic auth header
server.use(restify.CORS({credentials: true}));
server.use(restify.fullResponse());
server.use(restify.authorizationParser());
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(access.log());


// ***********************
// Users ressources

server.get( // Return user profile
    '/users/:id', access.authentificated(), access.idRequired(), access.userRestricted(),
    route.Users.info);

server.post( // Create a new user
    '/users/:id/create/:password', access.idRequired(), access.passwordRequired(),
    route.Users.create);

server.get( // Send credential and return auth token (login)
    '/users/:id/login/:password', access.idRequired(), access.passwordRequired(),
    route.Users.login);



// ************************
// Folders ressources

server.get( // Return folders list
    '/users/:id/folders/', access.authentificated(), access.idRequired(), access.userRestricted(),
    route.Folders.list);
server.get( // return folders details
    '/users/:id/folders/:secret', access.authentificated(), access.idRequired(), access.secretRequired(), access.userRestricted(),
    route.Folders.get);
server.post( // create a new folder with a random secret
    '/users/:id/folders', access.authentificated(), access.idRequired(), access.userRestricted(),
    route.Folders.create);
server.post( // create a new folder with a secret
    '/users/:id/folders/:secret', access.authentificated(), access.idRequired(), access.secretRequired(), access.userRestricted(),
    route.Folders.connect);
server.del( // delete a shared folder
    '/users/:id/folders/:secret', access.authentificated(), access.idRequired(), access.secretRequired(), access.userRestricted(),
    route.Folders.delete);
server.put( // update existing shared folder
    '/users/:id/folders/:secret', access.authentificated(), access.idRequired(), access.secretRequired(), access.userRestricted(),
    route.Folders.update);


// ***********************
// Serve static file

server.get(/\/.*/, restify.serveStatic({
    directory: '../btsync-saas-client/app/',
    default: 'index.html'
}));

// start server
server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});
