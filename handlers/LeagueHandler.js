"use strict";
const mysql = require('mysql');
const _ = require('lodash');

module.exports = (options, server, request, reply) => {

    const leagueQuery = `select t1.group, t2.Name AS teamName, IFNULL(standing, '-') AS standing, 
        (won-lost) AS matchPoint, 
        (gamesWon-gamesLost) AS gamePoint, 
        (pointsWon - pointsLost) AS pointDiff
        from league t1 
        join team t2 on (t1.team = t2.Id) where round = '${request.params.round}'`;

    const context = {};
    context.pageTitle = `Round ${request.params.round} Standings`;
    context.round = request.params.round;

    var connection = mysql.createConnection(server.settings.app.dbUrl);

    connection.connect();

    connection.query(leagueQuery, function(err, rows, fields) {
      if (err) throw err;
      context.groups =  _.groupBy(rows, 'group');
      return reply.view(options.view, context);
    });

    connection.end();
    
};