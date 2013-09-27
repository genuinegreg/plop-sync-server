'use strict';

var check = require('validator').check;
var sanitize = require('validator').sanitize;

var schema = require('./schema');
var restify = require('restify');

exports.authentificated = function () {

    return function (req, res, next) {

        console.info('authentificated()');
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

exports.userRestricted = function () {
    return function (req, res, next) {
        if (req.params.id !== req.user._id) return next(
            new restify.NotAuthorizedError('You are not allowed to access other users profile'));
        next();
    };
};

exports.idRequired = function () {
    return function (req, res, next) {
        if (!req.params.id)
            return next(new restify.MissingParameterError('missing :id parameter'));

        req.params.id = sanitize(req.params.id).trim();
        next();
    };
};

exports.secretRequired = function () {
    return function (req, res, next) {
        if (!req.params.secret)
            return next(new restify.MissingParameterError('missing :secret parameter'));

        req.params.secret = sanitize(req.params.secret).trim();
        next();
    };
};

exports.passwordRequired = function () {
    return function (req, res, next) {
        if (!req.params.password)
            return next(new restify.MissingParameterError('missing :password parameter'));

        req.params.password = sanitize(req.params.password).trim();
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