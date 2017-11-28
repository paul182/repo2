"use strict";
const async = require('async');
const mysql = require('mysql');

module.exports = (options, server, request, reply) => {

    var connection = mysql.createConnection(server.settings.app.dbUrl);

    const matchUpdateQuery = `update matches t1 set team1game1 = 0, team1game2 = 0, team1game3 = null,
        team2game1 = 0, team2game2 = 0, team2game3 = null, winner = null, gameTS = null where round = 1 and t1.group in ('C', 'D', 'E', 'F')`;

    const leagueUpdateQuery = `update league l set 
        l.played = 0, l.won = 0, l.lost = 0, l.gamesWon = 0, l.gamesLost = 0,
        l.pointsWon = 0, l.pointsLost = 0, l.standing = null, l.teamsBeaten = null
        where round = 1 and l.group in ('C', 'D', 'E', 'F')`;

    async.parallel([
        function(cb) {
            connection.query(matchUpdateQuery, function(err, result, fields) {
              cb(err);
            });
        },
        function(cb) {
            connection.query(leagueUpdateQuery, function(err, result, fields) {
              cb(err);
            });
        }
    ],
    function(err, results) {
      reply('Success');

      return connection.end();
    });
};