"use strict";
//var CryptoJS = require("crypto-js");

module.exports = (options, server, request, reply) => {
    console.log(request.payload);
    //var hash = CryptoJS.HmacSHA1(request.payload.password, server.settings.app.pwdHash);
    request.cookieAuth.set({ sid: request.payload.password});
    return reply.redirect('/');
};