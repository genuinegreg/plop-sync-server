'use strict';


var restify = require('restify');
var bunyan = require('bunyan');

function Server(
    name /* config.server.name */,
    routes,
    accessControlMiddleware,
    mailer
    ) {

    console.info('Initialize Server');

    var access = accessControlMiddleware;

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

    var server  = restify.createServer({
        name: name,
        log: log

    });

    this.server = server;


    // Use Cross Origin Request Sharing middleware
    server.use(restify.CORS({credentials: true}));
    server.use(restify.fullResponse());
    // Use Use HTTP Basic Authentication midleware
    server.use(restify.authorizationParser());
    // Use body parser middleware
    server.use(restify.bodyParser());


    // ***********************
    // Users ressources
    server.get( // Return user profile
        '/users/:id', access.authenticated(), access.idRequired(), access.userRestricted(),
        routes.Users.info);

    server.put( // Update user profile
        '/users/:id', access.authenticated(), access.idRequired(), access.userRestricted(), access.checkEmail(),
        routes.Users.update);

    server.post( // Create a new user
        '/users/:id/create', access.idRequired(), access.passwordRequired(),
        routes.Users.create);

    server.post( // Send credential and return auth token (login)
        '/users/:id/login', access.idRequired(), access.passwordRequired(),
        routes.Users.login);


    // ************************
    // Folders ressources

    server.get( // Return folders list
        '/users/:id/folders', access.authenticated(), access.idRequired(), access.userRestricted(),
        routes.Folders.list);
    server.get( // return folders details
        '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
        routes.Folders.get);
    server.post( // create a new folder (with or without secret
        '/users/:id/folders', access.authenticated(), access.idRequired(), access.userRestricted(),
        routes.Folders.create);
    server.del( // delete a shared folder
        '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
        routes.Folders.delete);
    server.put( // update existing shared folder
        '/users/:id/folders/:folderId', access.authenticated(), access.idRequired(), access.folderIdRequired(), access.userRestricted(),
        routes.Folders.update);


    // ***********************
    // Serve static file

    server.get(/\/.*/, restify.serveStatic({
        directory: '../client/dist/',
        default: 'index.html'
    }));

}

Server.prototype.start = function() {
    var server = this.server;

    this.server.listen(8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
};



module.exports = {
    'server': ['type', Server]
};