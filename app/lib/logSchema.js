'use strict';

// mongo stuff
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assert = require('assert-plus');


if (!process.env.DB_HOST) throw new Error('Missing env variable DB_HOST');
if (!process.env.DB_NAME) throw new Error('Missing env variable DB_NAME');

var conn = mongoose.createConnection('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME);

//mongoose.connect('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME);


/**
 * Disk usage log schema
 * @type {Schema}
 */
var diskLogSchema = new Schema({
    hostname: {type: String, index: true},
    metric: {type: String, index: true},
    size: Number,
    folder: String,
    time: Date
});
diskLogSchema.statics.findSize = function (containerId, apparent, cb) {

    assert.string(containerId);
    assert.optionalBool(apparent);
    assert.optionalFunc(cb);

    var _this = this;

    if (apparent) {
        _this.model('DiskLog').
            findOne({
                hostname: containerId,
//                metric: 'apparent-size'
            }).
            sort('-$natural').
            exec(cb);
    }
    else {
        _this.model('DiskLog').
            findOne({
                hostname: containerId,
//                metric: 'disk-usage'
            }).
            sort('-$natural').
            exec(cb);
    }
};

var DiskLog = conn.model('DiskLog', diskLogSchema, 'btsync.size');


/**
 * Dstat log schema
 * @type {Schema}
 */
var dstatLogSchema = new Schema({
    hostname: {type: String, index: true},
    dstat: {
        'net/total': {
            recv: Number,
            send: Number
        }
    },
    time: Date
});
dstatLogSchema.statics.findDstat = function (containerId, cb) {

    assert.string(containerId);
    assert.optionalFunc(cb);

    var _this = this;

    _this.model('DstatLog').
        findOne({
            hostname: containerId
        }).
        sort('-$natural').
        exec(cb);

};
var DstatLog = conn.model('DstatLog', dstatLogSchema, 'btsync.dstat');


/**
 * Exports
 * @type {{DstatLog: *, DiskLog: *}}
 */
module.exports = {
    DstatLog: DstatLog,
    DiskLog: DiskLog
};
