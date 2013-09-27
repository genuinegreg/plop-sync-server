'use strict';

var async = require('async');
var restify = require('restify');
var schema = require('./schema');
var crypto = require('crypto');

var check = require('validator').check;
var sanitize = require('validator').sanitize;


exports.Users = {
    info: function getUserInfo(req, res, next) {

        schema.User.findOne({_id: req.params.id}, function (err, user) {

            if (err) return next(new restify.InternalError());
            if (!user) return next(new restify.ResourceNotFoundError());

            res.send({
                user: {
                    id: user._id
                }
            });

        });
    },
    create: function createUser(req, res, next) {

        schema.User.create(req.params.id, req.params.password, function (err, user) {

            console.log('create() callback');

            console.log(err);
            console.log(user);

            if (err && err.code === 11000) return next(new restify.InvalidArgumentError('Username already in use'));
            if (err) return next(new restify.InternalError());

            res.send({
                user: {
                    id: user._id,
                    token: user.token
                }
            });
        });
    },
    login: function login(req, res, next) {

        schema.User.login(req.params.id, req.params.password, function (err, user) {

            if (err) return next(new restify.InternalError());
            if (!user) return next(new restify.InvalidCredentialsError());


            res.send({
                user: {
                    id: user.id,
                    token: user.token
                }
            });
        });
    }
};


exports.Folders = {
    list: function getSharedFoldersList(req, res, next) {
        console.log('getSharedFoldersList()');
        req.user.findFolders(function (err, folders) {

            if (err) return next(new restify.InternalError());

            async.map(
                folders,
                function iterator(item, cb) {
                    cb(undefined, {
                        secret: item.secret,
                        description: item.description
                    });
                },
                function callback(err, results) {
                    if (err) return next(new restify.InternalError());

                    res.send({
                        folders: results
                    });
                }
            );
        });
    },
    get: function getSharedFolderInformation(req, res, next) {
        console.log('getSharedFolderInformation()');
        schema.Folder.findOne(
            {
                user: req.user._id,
                secret: req.params.secret
            },
            function (err, folder) {
                if (err) return next(
                    new restify.InternalError());

                if (!folder) return next(
                    new restify.ResourceNotFoundError('Shared folder not found'));

                res.send({
                    folder: {
                        secret: folder.secret
                    }
                });
            }
        );

    },
    create: function createSharedFodler(req, res, next) {
        console.log('createSharedFodler()');
        var folder = new schema.Folder({
            secret: crypto.randomBytes(64).toString('hex'),
            user: req.user._id
        });

        folder.save(function (err, folder) {
            if (err) return next(new restify.InternalError());

            res.send({
                folder: {
                    secret: folder.secret,
                    description: folder.description
                }
            });

        });
    },
    connect: function connectToSharedFolder(req, res, next) {

        console.log('connectToSharedFolder()');
        var folder = new schema.Folder({
            secret: req.params.secret,
            user: req.user._id
        });

        folder.save(function (err, folder) {
            if (err) return next(new restify.InternalError());

            res.send({
                folder: {
                    secret: folder.secret,
                    description: folder.description
                }
            });

        });

    },
    delete: function deleteSharedFolder(req, res, next) {
        console.log('deleteSharedFolder()');

        schema.Folder.remove(
            {
                user: req.user._id,
                secret: req.params.secret
            },
            function (err, numberOfAffectedFolder) {
                if (err) return next(new restify.InternalError());

                if (numberOfAffectedFolder < 1)
                    return next(new restify.ResourceNotFoundError('Shared folder not found'));

                res.send({
                    remove: 'ok'
                });
            }
        );
    },
    update: function updateSharedFolder(req, res, next) {
        console.log('updateSharedFolder()');

        schema.Folder.findOne(
            {
                user: req.user._id,
                secret: req.params.secret
            },
            function (err, folder) {
                if (err) return next(new restify.InternalError());
                if (!folder) return next(new restify.ResourceNotFoundError('Shared folder not found'));

                if (req.params.name || req.params.description) {
                    if (req.params.name) folder.name = sanitize(req.params.name).xss();
                    if (req.params.description) folder.description = sanitize(req.params.description).xss();


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