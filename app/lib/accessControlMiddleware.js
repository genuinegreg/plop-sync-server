'use strict';

var check = require('validator').check;
var sanitize = require('validator').sanitize;

var schema = require('./schema');
var restify = require('restify');

/**
 * Ensure user is loged in
 * @returns {Function}
 */
exports.authenticated = function () {

    return function (req, res, next) {

        console.info('authenticated()');
        // if no username is provided juste pass
        if (!req.username || req.username === 'anonymous') return next(new restify.NotAuthorizedError('Missing auth token'));

        var userToken = sanitize(req.username).trim();

        // find user with the given token
        schema.User.findOne({token: userToken},
            function (err, user) {

                if (err) return next(new restify.InternalError());
                if (!user) return next(new restify.InvalidCredentialsError('Invalid credential token'));

                req.user = user;
                next();
            });
    };
};

/**
 * Ensure Ensure authenticated user is accessing his own ressources
 * @returns {Function}
 */
exports.userRestricted = function () {
    return function (req, res, next) {
        if (req.params.id !== req.user._id) return next(
            new restify.NotAuthorizedError('You are not allowed to access other users profile'));
        next();
    };
};

/**
 * Url param :id is required
 * @returns {Function}
 */
exports.idRequired = function () {
    return function (req, res, next) {
        if (!req.params.id)
            return next(new restify.MissingParameterError('missing :id parameter'));

        req.params.id = sanitize(req.params.id).trim();
        next();
    };
};

/**
 * Url param :folderId is required
 * @returns {Function}
 */
exports.folderIdRequired = function () {
    return function (req, res, next) {
        if (!req.params.folderId)
            return next(new restify.MissingParameterError('missing :folderId parameter'));

        req.params.folderId = sanitize(req.params.folderId).trim();
        next();
    };
};

/**
 * Post param :password is required
 * @returns {Function}
 */
exports.passwordRequired = function () {
    return function (req, res, next) {
        if (!req.params.password)
            return next(new restify.MissingParameterError('missing :password parameter'));

        req.params.password = sanitize(req.params.password).trim();
        next();
    };
};

/**
 * Validate Post param :email
 * Ensure it's not missing and is a valid email
 * @returns {Function}
 */
exports.checkEmail = function () {
    return function (req, res, next) {
        if (!req.params.email)
            return next(new restify.MissingParameterError('missing :email parameter'));

        req.params.email = sanitize(req.params.email).trim();

        try {
            check(req.params.email).isEmail();
        }
        catch (err) {
            return next(new restify.InvalidArgumentError('invalid :email parameter'));
        }

        next();
    };
};

exports.log = function log() {
    return function (req, res, next) {
        req.log.info([
            req.route.method,
            req.route.path,
            req.route.versions
        ].join('; '));

        next();

    };
};