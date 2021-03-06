'use strict';

require('colors');
var async = require('async');
var restify = require('restify');
var sanitize = require('validator').sanitize;



function Routes(dataSchema, logSchema, bittorrentSync) {

    console.info('Initialize [Routes]'.green);
    var _this = this;

    _this.Users = {
        info: function getUserInfo(req, res, next) {

            dataSchema.User.findOne({_id: req.params.id}, function (err, user) {

                    if (err) {
                        req.log.error(err, 'database error');
                        return next(new restify.InternalError());
                    }
                    if (!user) {
                        req.log.info('User not found');
                        return next(new restify.ResourceNotFoundError());
                    }

                    res.send({
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    });

                    req.log.info('ok');

                }
            )
            ;
        },
        update: function updateUser(req, res, next) {

            dataSchema.User.findOne(
                {
                    _id: req.params.id
                },
                function (err, user) {
                    if (err) {
                        req.log.error(err, 'database error');
                        return next(new restify.InternalError());
                    }
                    if (!user) {
                        req.log.info('Shared folder not found');
                        return next(new restify.ResourceNotFoundError('Shared folder not found'));
                    }


                    user.increment();

                    user.email = req.params.email;
                    user.firstName = req.params.firstName;
                    user.lastName = req.params.lastName;


                    user.updatePassword(req.params.password, function (err) {
                        if (err) {
                            req.log.error(err, 'database error');
                            return next(new restify.InternalError());
                        }

                        user.save(function (err) {
                            if (err) return next(new restify.InternalError());

                            res.send({
                                update: 'ok'
                            });
                            req.log.trace('ok');
                        });
                    });


                }
            );
        },
        create: function createUser(req, res, next) {

            dataSchema.User.create(req.params.id, req.params.password, function (err, user) {

                if (err && err.code === 11000) {
                    req.log.info('Username already in use')
                    return next(new restify.InvalidArgumentError('Username already in use'));
                }
                if (err) {
                    req.log.error(err, 'database error');
                    return next(new restify.InternalError());
                }

                res.send({
                    id: user._id,
                    token: user.token
                });
                req.log.trace('ok');
            });
        },
        login: function login(req, res, next) {

            dataSchema.User.login(req.params.id, req.params.password, function (err, user) {

                if (err) {
                    req.log.error(err, 'database error');
                    return next(new restify.InternalError());
                }
                if (!user) {
                    req.log.info('Invalid Credentials');
                    return next(new restify.InvalidCredentialsError());
                }


                res.send({
                    id: user.id,
                    token: user.token
                });
                req.log.trace('ok');
            });
        }
    };


    _this.Folders = {
        list: function getSharedFoldersList(req, res, next) {
            req.user.findFolders(function (err, folders) {

                if (err) {
                    req.log.error(err, 'database error');
                    return next(new restify.InternalError());
                }

                async.map(
                    folders,
                    function iterator(item, cb) {


                        async.parallel({
                            size: function (sizeCallback) {
                                logSchema.DiskLog.findSize(item.containerId, false, sizeCallback);
                            },
                            dstat: function (dstatCallback) {
                                logSchema.DstatLog.findDstat(item.containerId, dstatCallback);
                            }
                        }, function parallelCallback(err, results) {

                            if (err) {
                                req.log.error(err);
                                return next(
                                    new restify.InternalError());
                            }

                            cb(undefined, {
                                id: item._id,
                                name: item.name,
                                description: item.description,
                                created: item.created,
                                size: (results.size ? results.size.size : undefined),
                                dstat: (results.dstat ? results.dstat.dstat : undefined)
                            });

                        });
                    },
                    function callback(err, results) {
                        if (err) {
                            req.log.error(err);
                            return next(new restify.InternalError());
                        }

                        res.send(results);
                        req.log.trace('OK');
                    }
                );
            });
        },
        get: function getSharedFolderInformation(req, res, next) {
            dataSchema.Folder.findOne(
                {
                    user: req.user._id,
                    _id: req.params.folderId
                },
                function (err, folder) {
                    if (err) {
                        req.log.error(err);
                        return next(
                            new restify.InternalError());
                    }

                    if (!folder) return next(
                        new restify.ResourceNotFoundError('Shared folder not found'));

                    async.parallel({
                        size: function (sizeCallback) {
                            logSchema.DiskLog.findSize(folder.containerId, false, sizeCallback);
                        },
                        dstat: function (dstatCallback) {
                            logSchema.DstatLog.findDstat(folder.containerId, dstatCallback);
                        }
                    }, function parallelCallback(err, results) {

                        if (err) {
                            req.log.error(err);
                            return next(
                                new restify.InternalError());
                        }


                        res.send({
                                id: folder._id,
                                name: folder.name,
                                secret: folder.secret,
                                description: folder.description,
                                created: folder.created,
                                size: (results.size ? results.size.size : undefined),
                                dstat: (results.dstat ? results.dstat.dstat : undefined)
                            }
                        );
                        req.log.trace('OK');

                    });


                }
            )
            ;

        },
        create: function createSharedFolder(req, res, next) {

            // validation
            if (req.params.secret) { // trim secret input
                req.log.trace('Using user provided Secret');
                req.params.secret = sanitize(req.params.secret).trim();
            }
            else { //or generate a mock secret for now
                req.log.trace('Generating a new Secret');
                req.params.secret = bittorrentSync.getSecret();
            }

            if (req.params.name) // trim secret name
                req.params.name = sanitize(req.params.name).trim();

            if (req.params.description) // trim secret name
                req.params.description = sanitize(req.params.description).trim();


            // create a new folder data instance
            var folder = new dataSchema.Folder({
                name: req.params.name,
                secret: req.params.secret,
                description: req.params.description,
                user: req.user._id
            });

            // save folder
            folder.save(function(err, folder) {
                if (err || !folder) {
                    req.log.error(err, 'database error');
                    return next(new restify.InternalError());
                }

                // send response to client
                res.send({
                    id: folder._id,
                    name: folder.name,
                    secret: folder.secret
                });
                req.log.trace('OK');

                // then asynchronously start a new container
                bittorrentSync.startNewSyncContainer(folder, function(err) {
                    if (!err) return;
                    req.log.error(err, 'ERROR : bittorrentSync.startNewSyncContainer()');
                });

            });

        },
        delete: function deleteSharedFolder(req, res, next) {

            function dataBaseDeletionHandler(err, folder) {
                if (err) {
                    req.log.error(err, 'Error : dataSchema.Folder.findOneAndRemove()');
                    return next(new restify.InternalError());
                }

                if (!folder) {
                    req.log.info('Shared folder not found');
                    return next(new restify.ResourceNotFoundError('Shared folder not found'));
                }

                // send result back to the client
                res.send({
                    remove: 'ok'
                });
                req.log.debug('OK');

                // and then asynchronously delete the container
                bittorrentSync.stopAndDeleteSyncContainer(folder, function(err) {
                    if (!err) return;
                    req.log.error(err, 'Error: bittorrentSync.stopAndDeleteSyncContainer() unable to emove container');
                });
            }

            dataSchema.Folder.findOneAndRemove(
                {
                    user: req.user._id,
                    _id: req.params.folderId
                },
                dataBaseDeletionHandler
            );
        },
        update: function updateSharedFolder(req, res, next) {

            dataSchema.Folder.findOne(
                {
                    user: req.params.id,
                    _id: req.params.folderId
                },
                function (err, folder) {
                    if (err) {
                        req.log.error(err, 'Database error');
                        return next(new restify.InternalError());
                    }
                    if (!folder) {
                        req.log.info('Shared folder not found');
                        return next(new restify.ResourceNotFoundError('Shared folder not found'));
                    }

                    if (req.params.name || req.params.description) {
                        if (req.params.name) folder.name = sanitize(req.params.name).trim();
                        if (req.params.description) folder.description = sanitize(req.params.description).trim();

                        folder.increment();

                        folder.save(function (err) {
                            if (err) {
                                req.log.error(err, 'database error');
                                return next(new restify.InternalError());
                            }

                            res.send({
                                update: 'ok'
                            });
                            req.log.trace('OK');
                        });
                    }


                }
            );
        }
    };
}

module.exports = {
    'routes': ['type', Routes]
};