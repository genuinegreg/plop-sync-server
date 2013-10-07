'use strict';


if (!process.env.DB_HOST) throw new Error('Missing env variable DB_HOST');
if (!process.env.DB_NAME) throw new Error('Missing env variable DB_NAME');


var assert = require('assert-plus');
var sh = require('shelljs');

var Docker = new require('./docker').Docker;
var docker = new Docker();

// download and extract btsync exec on launch
if (!sh.which('./bin/btsync')) {
    sh.mkdir('-p', 'bin');
    sh.cd('bin');
    sh.exec('wget -q http://download-lb.utorrent.com/endpoint/btsync/os/linux-x64/track/stable -O btsync.tar.gz', {silent: true});
    sh.exec('tar -xvf btsync.tar.gz', {silent: true});
    sh.cd('..');
}


/**
 * Return a btsync secret
 * @returns {String} btsync Secret
 */
function getSecret() {
    return sh.exec('./bin/btsync --generate-secret', {silent: true}).output.trim();
}
exports.getSecret = getSecret;


/**
 * Start a new btsync container
 * @param secret container secret
 * @param dbHost mongodb logs host
 * @param cb
 */
exports.startNewSyncContainer = function (secret, cb) {

    assert.optionalString(secret);
    assert.func(cb);

    if (!secret) secret = getSecret();


    docker.run(
        {
            NAME: 'plop.io_sync',
            SECRET: secret,
            DB_HOST: process.env.DB_HOST,
            DB_NAME: process.env.DB_NAME,
            DB_COLLECTION: 'logs'
        },
        [
            '27027'
        ],
        'genuinegreg/plop-btsync',
        [],
        function (code, output) {
            if (code) return cb(new Error('Return code ' + code));

            cb(undefined, output);
        }
    );

};

/**
 * stop and delete a container
 * @param containerId
 * @param cb
 */
exports.stopAndDeleteSyncContainer = function (containerId, cb) {
    docker.stopAndDelete(containerId, function (code, results) {

        if (code) return cb(new Error('Return code ' + code));

        var resultsValidate = results.every(function (elt) {
            return elt.trim() === containerId.trim();
        });

        if (!resultsValidate)  return cb(new Error('Bad results'));

        cb(undefined);
    });
};
