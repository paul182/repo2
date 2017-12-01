"use strict";
const https = require('https');

module.exports = (options, server, request, reply) => {

    const url = `https://public-api.wordpress.com/rest/v1.1/sites/${server.settings.app.wpDomain}/posts/slug:${options.contentSlug}?fields=content`;
    const context = {};
    if(options.navPage === "home"){
        context.navHome = true;
        context.title = "Burlington Badminton Tournament 2017";
    }else if (options.navPage === "rules"){
        context.navRule = true;
        context.title = "Tournament Rules";
    }


    https.get(url, res => {
        res.setEncoding("utf8");
        let body = "";
        
        res.on("data", data => {
            body += data;
        });

        res.on("end", () => {
            context.wpContent = JSON.parse(body);
            reply.view(options.view, context);
        });
    });
};