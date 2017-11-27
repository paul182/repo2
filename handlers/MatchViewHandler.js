"use strict";
const mysql = require('mysql');
const _ = require('lodash');

module.exports = (options, server, request, reply) => {

    const matchesQuery = `select m.round, m.id, m.group, a.Name AS team1Name, 
    b.Name AS team2Name, a.Id AS team1, b.Id AS team2,
    DATE_FORMAT(IFNULL(m.gameTS, m.matchDate), "%Y-%m-%d") AS matchDate,
    m.team1game1, m.team1game2, m.team1game3,
    m.team2game1, m.team2game2, m.team2game3, m.winner
    FROM team a INNER JOIN matches m ON m.team1 = a.id
    INNER JOIN team b ON m.team2 = b.id
    where m.round = '${request.params.round}'
    ${request.params.group ? 'and m.group = ' + `'${request.params.group}'` : ''}`;


    const context = {};
    context.title = `Round ${request.params.round} Results`;
    context.navMatches = true;
    context.round = `Round ${request.params.round}  ${request.params.group ? 'Group ' + `${request.params.group}` : ''}`;
    context.group = request.params.group;

    // TODO: Set properly
    context.isLoggedIn = request.query.log ? true : false;

    var connection = mysql.createConnection(server.settings.app.dbUrl);

    connection.connect();

    connection.query(matchesQuery, function(err, rows, fields) {
      if (err) throw err;
      context.matches = rows;
      reply.view(options.view, context);
      return connection.end();
    });
};