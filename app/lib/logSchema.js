'use strict';


require('colors');
// mongo stuff
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assert = require('assert-plus');


exports.LogSchema = function (connection) {
    console.log('Initialize [LogSchema]'.green);

    assert.ok(connection, 'LogShema connection');

    var _this = this;


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


        //TODO: fix apparent and real size
        if (apparent) {
            _this.model('DiskLog').
                findOne({
                    hostname: containerId
//                metric: 'apparent-size'
                }).
                sort('-$natural').
                exec(cb);
        }
        else {
            _this.model('DiskLog').
                findOne({
                    hostname: containerId
//                metric: 'disk-usage'
                }).
                sort('-$natural').
                exec(cb);
        }
    };

    _this.DiskLog = connection.model('DiskLog', diskLogSchema, 'btsync.size');


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
    _this.DstatLog = connection.model('DstatLog', dstatLogSchema, 'btsync.dstat');


};
