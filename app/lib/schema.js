'use strict';

require('colors');
var assert = require('assert-plus');
// crypto stuff
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var async = require('async');


// mongo stuff
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


function ConnectionFactory(
    host /* config.database.host */,
    name /* config.database.name */) {

    assert.string(host, 'ConnectionFactory host');
    assert.string(name, 'ConnectionFactory name');

    var connectionUrl = 'mongodb://' + host + '/' + name;

    console.log('ConnectionFactory() : Connecting to', connectionUrl);
    return mongoose.createConnection(connectionUrl);
}

function DataSchema(
    connection,
    BCRYPT_STRENGTH /* config.bcrypt.strength */,
    TOKEN_STRENGTH /* config.session.tokenStrength */ ) {


    console.log('Initialize [DataSchema]'.green);
    var _this = this;


    /**
     * User Schema
     * @type {*}
     */
    var userSchema = new Schema({
        _id: String,
        password: String,
        email: String,
        firstName: String,
        lastName: String,
        token: {type: String, index: true, unique: true, sparse: true, background: false}
    });

    // *************
    // instance methods
    userSchema.methods.findFolders = function findFolders(cb) {
        var _this = this;
        return _this.model('Folder').find({user: this._id}, cb);
    };

    userSchema.methods.updatePassword = function (password, cb) {
        var _this = this;

        if (!password)
            return cb(); // don't update password if no password provided

        if (bcrypt.compareSync(password, _this.password))
            return cb(); // don't update password if it has not been chanegd


        bcrypt.hash(password, BCRYPT_STRENGTH, function (err, hash) {
            if (err) return cb(err);

            _this.password = hash;
            cb();
        });
    };

    // *****
    // statics
    userSchema.statics.create = function createUser(id, password, createCallback) {

        var _this = this;

        async.waterfall([
            function hash(callback) {
                console.log('hash()');
                bcrypt.hash(password, BCRYPT_STRENGTH, callback);
            }  ,
            function saveUser(hash, callback) {
                console.log('saveUser()');

                var LocalUserModel = _this.model('User');
                var user = new LocalUserModel({
                    _id: id,
                    password: hash
                });

                user.save(callback);
            },
            function generateToken(user, numberAffected, callback) {
                console.log('generateToken()');


                var ok = false;
                var i = 0;
                var newUser;
                async.doUntil(
                    function doUntil(cb) {

                        var token = crypto.randomBytes(TOKEN_STRENGTH).toString('base64');

                        _this.model('User').findByIdAndUpdate(
                            user._id,
                            {
                                token: token,
                                $inc: {__v: 1}
                            },
                            function (err, user) {
                                if (!err && user) {
                                    ok = true;
                                    newUser = user;
                                }
                                cb();
                            }
                        );
                    },
                    function test() {
                        console.log('test 1: ' + ok);
                        console.log('test 2: ' + (i > 10));
                        return ok || i++ > 10;
                    },
                    function cb(err) {
                        if (!ok) return callback(new Error('unable to find a unique token'));
                        callback(undefined, newUser);
                    });


            }
        ],
            createCallback);
    };

    userSchema.statics.login = function (id, password, cb) {

        var _this = this;

        _this.model('User').findOne({
                _id: id
            },
            function (err, user) {
                if (err) return cb(err);

                if (!user) return cb();
                if (!bcrypt.compareSync(password, user.password)) return cb();


                return cb(undefined, user);
            }
        );
    };

    _this.User = connection.model('User', userSchema);


    /**
     * Folder Schema
     * @type {*}
     */
    var folderSchema = new Schema({
        name: String,
        secret: { type: String, index: true },
        description: String,
        created: { type: Date, default: Date.now},
        containerId: String,
        user: { type: String, ref: 'User', index: true}
    });
    _this.Folder = connection.model('Folder', folderSchema);


}


module.exports = {
    connection: ['factory', ConnectionFactory],
    dataSchema: ['type', DataSchema],
    logSchema: ['type', require('./logSchema').LogSchema]
};