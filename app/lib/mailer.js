'use strict';

require('colors');
var email = require('emailjs');
var assert = require('assert-plus');

function Mailer(
    user        /* config.mailer.user */,
    password    /* config.mailer.password */,
    host        /* config.mailer.host */
    ) {

    console.log('Initialize [Mailer]'.green);

    assert.string(user, 'Mailer user');
    assert.string(password, 'Mailer password');
    assert.string(host, 'Mailer host');

    this.server = email.server.connect({
        user:       user,
        password:   password,
        host:       host,
        ssl:        true
    });
}

Mailer.prototype.send = function(message, callback) {
    this.server.send(message, callback);
};

module.exports = {
    'mailer': ['type', Mailer]
};