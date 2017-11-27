"use strict"
var CryptoJS = require("crypto-js");

exports.register = function (server, options, next) {

    // server.auth.strategy(name, scheme, [mode], [options])
    server.auth.strategy('session', 'cookie', true, {
        password: server.settings.app.pwdHash,
        cookie: 'sid',
        redirectTo: '/login',
        appendNext: true,
        isSecure: false,
        isHttpOnly: false,
        isSameSite: false,
        validateFunc: function (request, session, callback) {
            var hash = server.settings.app.pwdKey;
            // var hash = CryptoJS.HmacSHA1(server.settings.app.pwdKey, server.settings.app.pwdHash);
            if(hash === session.sid){
                return callback(null, true);
            }else{
                return callback(null, false);
            }
        }
    });
    next();
};

exports.register.attributes = {
    pkg: {
        name: "auth",
        version: "0.0.0"
    }
};