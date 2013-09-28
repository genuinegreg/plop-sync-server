'use strict';

// crypto stuff
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var async = require('async');


// mongo stuff
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// ******************
// Const
var BCRYPT_STRENGTH = 10;
var TOKEN_STRENGTH = 64;


if (!process.env.DB_HOST) throw new Error('Missing env variable DB_HOST');
if (!process.env.DB_NAME) throw new Error('Missing env variable DB_NAME');


mongoose.connect('mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME);


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

var User = mongoose.model('User', userSchema);


/**
 * Folder Schema
 * @type {*}
 */
var folderSchema = new Schema({
    name: String,
    secret: { type: String, index: true },
    description: String,
    user: { type: String, ref: 'User', index: true}
});
var Folder = mongoose.model('Folder', folderSchema);


exports.User = User;
exports.Folder = Folder;