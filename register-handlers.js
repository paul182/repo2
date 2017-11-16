"use strict"

const _ = require('lodash');
const fs = require('fs');

module.exports = (server) => {
    fs.readdirSync(`${__dirname}/handlers`).forEach(file => {
        // handlers
        const HandlerImpl = require(`${__dirname}/handlers/${file}`);
        const handlerName = file.match(/(.*)(.js)/i)[1];

        server.handler(handlerName, (route, handlerOptions) => {
            return function (request, reply) {
                return HandlerImpl.apply(this, [handlerOptions, server, request, reply]);
            };
        });
    });
};