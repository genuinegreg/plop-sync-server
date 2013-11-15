'use strict';

require('colors');
var assert = require('assert-plus');
var sh = require('shelljs');


function BittorrentSync(docker) {
    console.info('Initialize [BittorrentSync]'.green);

    this.docker = docker;

    // download and extract btsync exec on launch
    if (!sh.which('./bin/btsync')) {
        sh.mkdir('-p', 'bin');
        sh.cd('bin');
        sh.exec('wget -q http://download-lb.utorrent.com/endpoint/btsync/os/linux-x64/track/stable -O btsync.tar.gz', {silent: true});
        sh.exec('tar -xvf btsync.tar.gz', {silent: true});
        sh.cd('..');
    }

}


/**
 * Return a btsync secret
 * @returns {String} btsync Secret
 */
BittorrentSync.prototype.getSecret = function getSecret() {
    return sh.exec('./bin/btsync --generate-secret', {silent: true}).output.trim();
};


/**
 * Start a new btsync container
 * @param secret container secret
 * @param dbHost mongodb logs host
 * @param cb
 */
BittorrentSync.prototype.startNewSyncContainer = function (secret, cb) {

    assert.optionalString(secret);
    assert.func(cb);

    var _this = this;

    if (!secret) secret = _this.getSecret();


    _this.docker.run(
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
            if (code) {
                console.error('Docker return code ' + code);
                return cb(new Error('Return code ' + code));
            }

            cb(undefined, (output ? output.trim() : undefined));
        }
    );

};

/**
 * stop and delete a container
 * @param containerId
 * @param cb
 */
BittorrentSync.prototype.stopAndDeleteSyncContainer = function (containerId, cb) {

    var _this = this;

    _this.docker.stopAndDelete(containerId, function (code, results) {

        if (code) return cb(new Error('Return code ' + code));

        var resultsValidate = results.every(function (elt) {
            return elt.trim() === containerId.trim();
        });

        if (!resultsValidate)  return cb(new Error('Bad results'));

        cb(undefined);
    });
};


module.exports = {
    bittorrentSync: ['type', BittorrentSync]
};