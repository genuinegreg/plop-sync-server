'use strict';

var async = require('async');
var restify = require('restify');
var sanitize = require('validator').sanitize;



exports.Route = function Route(schema, logSchema, dockerBtSync) {
    var _this = this;

    _this.Users = {
        info: function getUserInfo(req, res, next) {

            schema.User.findOne({_id: req.params.id}, function (err, user) {

                    if (err) return next(new restify.InternalError());
                    if (!user) return next(new restify.ResourceNotFoundError());

                    res.send({
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    });

                }
            )
            ;
        },
        update: function updateUser(req, res, next) {
            console.log('updateUser()');

            schema.User.findOne(
                {
                    _id: req.params.id
                },
                function (err, user) {
                    if (err) return next(new restify.InternalError());
                    if (!user) return next(new restify.ResourceNotFoundError('Shared folder not found'));


                    user.increment();

                    user.email = req.params.email;
                    user.firstName = req.params.firstName;
                    user.lastName = req.params.lastName;


                    user.updatePassword(req.params.password, function (err) {
                        if (err)  return next(new restify.InternalError());

                        user.save(function (err) {
                            if (err) return next(new restify.InternalError());

                            res.send({
                                update: 'ok'
                            });
                        });
                    });


                }
            );
        },
        create: function createUser(req, res, next) {

            schema.User.create(req.params.id, req.params.password, function (err, user) {

                console.log('create() callback');

                console.log(err);
                console.log(user);

                if (err && err.code === 11000) return next(new restify.InvalidArgumentError('Username already in use'));
                if (err) return next(new restify.InternalError());

                res.send({
                    id: user._id,
                    token: user.token
                });
            });
        },
        login: function login(req, res, next) {

            schema.User.login(req.params.id, req.params.password, function (err, user) {

                if (err) return next(new restify.InternalError());
                if (!user) return next(new restify.InvalidCredentialsError());


                res.send({
                    id: user.id,
                    token: user.token
                });
            });
        }
    };


    _this.Folders = {
        list: function getSharedFoldersList(req, res, next) {
            console.log('getSharedFoldersList()');
            req.user.findFolders(function (err, folders) {

                if (err) return next(new restify.InternalError());

                async.map(
                    folders,
                    function iterator(item, cb) {


                        async.parallel({
                            size: function (sizeCallback) {
                                logSchema.DiskLog.findSize(item.containerId.trim(), false, sizeCallback);
                            },
                            dstat: function (dstatCallback) {
                                logSchema.DstatLog.findDstat(item.containerId.trim(), dstatCallback);
                            }
                        }, function parallelCallback(err, results) {

                            if (err) return next(
                                new restify.InternalError());

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
                        if (err) return next(new restify.InternalError());

                        res.send(results);
                    }
                );
            });
        },
        get: function getSharedFolderInformation(req, res, next) {
            console.log('getSharedFolderInformation()');
            schema.Folder.findOne(
                {
                    user: req.user._id,
                    _id: req.params.folderId
                },
                function (err, folder) {
                    if (err) return next(
                        new restify.InternalError());

                    if (!folder) return next(
                        new restify.ResourceNotFoundError('Shared folder not found'));

                    async.parallel({
                        size: function (sizeCallback) {
                            logSchema.DiskLog.findSize(folder.containerId.trim(), false, sizeCallback);
                        },
                        dstat: function (dstatCallback) {
                            logSchema.DstatLog.findDstat(folder.containerId.trim(), dstatCallback);
                        }
                    }, function parallelCallback(err, results) {

                        if (err) return next(
                            new restify.InternalError());


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

                    });


                }
            )
            ;

        },
        create: function createSharedFolder(req, res, next) {
            console.log('createSharedFolder()');

            if (req.params.secret) // trim secret input
                req.params.secret = sanitize(req.params.secret).trim();
            else //or generate a mock secret for now
                req.params.secret = dockerBtSync.getSecret();

            if (req.params.name) // trim secret name
                req.params.name = sanitize(req.params.name).trim();

            if (req.params.description) // trim secret name
                req.params.description = sanitize(req.params.description).trim();


            dockerBtSync.startNewSyncContainer(req.params.secret, function (err, containerId) {

                if (err) {
                    console.error(err);
                    return next(new restify.InternalError());
                }

                var folder = new schema.Folder({
                    name: req.params.name,
                    secret: req.params.secret,
                    description: req.params.description,
                    containerId: containerId,
                    user: req.user._id
                });

                folder.save(function (err, folder) {
                    if (err) return next(new restify.InternalError());

                    console.log(folder);

                    res.send({
                        id: folder._id,
                        name: folder.name,
                        secret: folder.secret
                    });

                });
            });

        },
        delete: function deleteSharedFolder(req, res, next) {
            console.log('deleteSharedFolder()');

            schema.Folder.findOneAndRemove(
                {
                    user: req.user._id,
                    _id: req.params.folderId
                },
                function (err, folder) {
                    if (err) return next(new restify.InternalError());

                    if (!folder)
                        return next(new restify.ResourceNotFoundError('Shared folder not found'));

                    dockerBtSync.stopAndDeleteSyncContainer(folder.containerId, function (err) {
                        if (err) return next(new restify.InternalError());

                        res.send({
                            remove: 'ok'
                        });
                    });
                }
            );
        },
        update: function updateSharedFolder(req, res, next) {
            console.log('updateSharedFolder()');

            schema.Folder.findOne(
                {
                    user: req.params.id,
                    _id: req.params.folderId
                },
                function (err, folder) {
                    if (err) return next(new restify.InternalError());
                    if (!folder) return next(new restify.ResourceNotFoundError('Shared folder not found'));

                    if (req.params.name || req.params.description) {
                        if (req.params.name) folder.name = sanitize(req.params.name).trim();
                        if (req.params.description) folder.description = sanitize(req.params.description).trim();

                        folder.increment();

                        folder.save(function (err) {
                            if (err) return next(new restify.InternalError());

                            res.send({
                                update: 'ok'
                            });
                        });
                    }


                }
            );
        }
    };
}