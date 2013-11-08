'use strict';

var async = require('async');
var assert = require('assert-plus');
var sh = require('shelljs');


if (!sh.which('docker')) throw new Error('`docker` command is needed');

function Docker(name) {
    if (name) this.name = name;
}
exports.Docker = Docker;

/**
 * exec `docker run` command
 * @param env
 * @param ports
 * @param image
 * @param command
 * @returns {BlogPost.slug.trim|*|string|SchemaType|jQuery.trim}
 */
Docker.prototype.run = function (env, ports, image, command, cb) {

    var _this = this;

    // check parameters
    assert.object(env, 'env');
    assert.arrayOfString(ports, 'ports');
    assert.string(image, 'image');
    assert.arrayOfString(command, 'command');
    assert.func(cb, 'callback');

    var cmd = [];

    cmd.push('docker');
    cmd.push('run');
    cmd.push('-dns');
    cmd.push('8.8.8.8');
    cmd.push('-d');
    if (_this.name) {
        cmd.push('-name');
        cmd.push(_this.name);
    }

    Object.keys(env).forEach(function (key) {
        cmd.push('-e');
        cmd.push(key + '="' + env[key] + '"');
    });

    ports.forEach(function (port) {
        cmd.push('-p');
        cmd.push(port);
    });

    cmd.push(image);

    command.forEach(function (elt) {
        cmd.push(elt);
    });

    sh.exec(cmd.join(' '), {silent: true}, cb);

};

/**
 * exec `docker stop` and `docker rm -v` commands
 * @param containerId
 * @param cb
 */
Docker.prototype.stopAndDelete = function (containerId, cb) {
    async.series([
        function (stopCallback) {
            sh.exec('docker stop -t 2 ' + containerId, stopCallback);
        },
        function (deleteCallback) {
            sh.exec('docker rm -v ' + containerId, deleteCallback);
        }
    ], function (err, results) {
        cb(err, results);

    });
};