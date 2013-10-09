'use strict';


var restify = require('restify');

var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'plop-sync',
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
//server.use(restify.queryParser());
server.use(restify.bodyParser());
//server.use(access.log());


// ***********************
// Users ressources

server.get( // Return user profile
    '/users/:id', access.authenticated(), access.idRequired(), access.userRestricted(),
    route.Users.info);

server.put( // Update user profile
    '/users/:id', access.authenticated(), access.idRequired(), access.userRestricted(), access.checkEmail(),
    route.Users.update);

server.post( // Create a new user
    '/users/:id/create', access.idRequired(), access.passwordRequired(),
    route.Users.create);

server.post( // Send credential and return auth token (login)
    '/users/:id/login', access.idRequired(), access.passwordRequired(),
    route.Users.login);


// ************************
// Folders ressources

server.get( // Return folders list
    '/users/:id/folders/', access.authenticated(), access.idRequired(), access.userRestricted(),
    route.Folders.list);
server.get( // return folders details
    '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
    route.Folders.get);
server.post( // create a new folder (with or without secret
    '/users/:id/folders', access.authenticated(), access.idRequired(), access.userRestricted(),
    route.Folders.create);
server.del( // delete a shared folder
    '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
    route.Folders.delete);
server.put( // update existing shared folder
    '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
    route.Folders.update);


// ***********************
// Serve static file

server.get(/\/.*/, restify.serveStatic({
    directory: '../client/dist/',
    default: 'index.html'
}));

// start server
server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});
