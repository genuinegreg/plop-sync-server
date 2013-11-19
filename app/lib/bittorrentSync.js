'use strict';

require('colors');
var assert = require('assert-plus');
var sh = require('shelljs');


function BittorrentSync(docker, dbConfig /* config.database */) {
    console.info('Initialize [BittorrentSync]'.green);

    this.docker = docker;
    this.dbConfig = dbConfig;

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
BittorrentSync.prototype.startNewSyncContainer = function (folder, cb) {

    assert.object(folder, 'folder');
    assert.string(folder.secret, 'folder.secret');
    assert.object(folder._id, 'folder._id');
    assert.optionalFunc(cb, 'cb');

    cb = cb || function(){};

    var _this = this;


    _this.docker.run(
        {
            NAME: 'plop.io_sync',
            SECRET: folder.secret,
            DB_HOST: _this.dbConfig.host,
            DB_NAME: _this.dbConfig.name,
            DB_COLLECTION: 'logs'
        },
        [
            '27027'
        ],
        [
            '/btsync_data/'
        ],
        'genuinegreg/plop-btsync', [], function (code, output) {
            if (code) {
                return cb(new Error('Docker return code : ' + code));
            }

            if (!output) {
                return cb(new Error('Docker has not return a containerId'));
            }

            var containerId = output.trim();

            folder.containerId = containerId;
            folder.increment();
            folder.save();

            cb();
        }
    );

};

/**
 * stop and delete a container
 * @param containerId
 * @param cb
 */
BittorrentSync.prototype.stopAndDeleteSyncContainer = function (folder, cb) {

    assert.object(folder._id, 'folder._id');
    assert.string(folder.containerId, 'folder.containerId');
    assert.optionalFunc(cb, 'cb');

    cb = cb || function(){};

    var _this = this;

    _this.docker.stopAndDelete(folder.containerId, function (code, results) {

        if (code) return cb(new Error('Return code ' + code));


        var resultsValidate = results.every(function (elt) {
            return elt === folder.containerId;
        });

        if (!resultsValidate)  return cb(new Error('Bad results'));

        return cb();
    });
};


module.exports = {
    bittorrentSync: ['type', BittorrentSync]
};