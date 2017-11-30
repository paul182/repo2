"use strict";
const async = require('async');
const mysql = require('mysql');
const _ = require('lodash');
const rankGroup = require('../shared/rankGroup');

module.exports = (options, server, request, reply) => {

    // Saves the match score in the DB. Calculates the group standings
   
    var connection = mysql.createConnection(server.settings.app.dbUrl),
        context = {};

    const startTransaction = function(cb){
        connection.beginTransaction(function(err) {
          cb(err);
        });
    }

    const isMatchAlreadyUpdated = function(cb){
        const currentMatcheQuery = `select m.round, m.group, m.team1, m.team2, m.winner
        FROM matches m where m.id = ${request.payload.matchId}`;

        connection.query(currentMatcheQuery, function(err, rows, fields) {
          if (err) {
            cb(err);
          }else if(rows.length < 1){
            cb(new Error('Match not found'));
          }else if(rows[0].winner){
            context.match = rows[0];
            cb(null);
          }else{
            cb(new Error('Match not already saved. Result not updated'));
          }
        });        
    }

    const updateMatchResult = function(cb){
        const matchUpdateQuery = `update matches set team1game1 = ?, team1game2 = ?, team1game3 = ?,
            team2game1 = ?, team2game2 = ?, team2game3 = ?, winner = ? where id = ${request.payload.matchId}`;

        var params = [request.payload.t1g1,
                      request.payload.t1g2,
                      isNaN(request.payload.t1g3) ? null : request.payload.t1g3,
                      request.payload.t2g1,
                      request.payload.t2g2,
                      isNaN(request.payload.t2g3) ? null : request.payload.t2g3,
                      request.payload.winner,  
                    ];

        connection.query(matchUpdateQuery, params, function(err, result, fields) {
          if (err) {
            cb(err);
          }else{
            cb(null);
          }
        });
    }

    const updateSingleTeamStats = function(team, cb){

        const teamMatches = `select team1, team2, team1game1, team1game2, team1game3, team2game1, 
        team2game2, team2game3, winner from matches m 
        where m.round = '${context.match.round}' and m.group = '${context.match.group}' 
        and (m.team1 = ${team} or m.team2 =${team})`;

        const updateTeamStats = `update league l set 
            l.played = ?,
            l.won = ?,
            l.lost = ?,
            l.gamesWon = ?,
            l.gamesLost = ?,
            l.pointsWon = ?,
            l.pointsLost = ?,
            l.teamsBeaten = ?
            where round = ? and l.group = ? and team = ?`;

        connection.query(teamMatches, function(err, rows, fields) {
          if (err) {
            cb(err);
          }else{
            var lMatchWon = 0,
                lMatchLost = 0,
                lGamesWon = 0,
                lGamesLost = 0,
                lPointsWon = 0,
                lPointsLost = 0,
                lteamsbeaten = "";

            for (var i = 0; i < rows.length; i++) { 

              if(rows[i].team1 == team){
                lPointsWon = parseInt(rows[i].team1game1) + parseInt(rows[i].team1game2);
                lPointsLost = parseInt(rows[i].team2game1) + parseInt(rows[i].team2game2);
                parseInt(rows[i].team1game1) > parseInt(rows[i].team2game1) ? lGamesWon++ : lGamesLost++;
                parseInt(rows[i].team1game2) > parseInt(rows[i].team2game2) ? lGamesWon++ : lGamesLost++;

                if(!isNaN(parseInt(rows[i].team1game3))){
                  parseInt(rows[i].team1game3) > parseInt(rows[i].team2game3)? lGamesWon++ : lGamesLost++;
                  lPointsWon = lPointsWon + parseInt(rows[i].team1game3);
                  lPointsLost = lPointsLost + parseInt(rows[i].team2game3);
                }

                if(rows[i].winner == team){
                  lMatchWon ++;
                  lteamsbeaten = lteamsbeaten + `~${rows[i].team2}~`;
                }
              }else{
                lPointsWon = parseInt(rows[i].team2game1) + parseInt(rows[i].team2game2);
                lPointsLost = parseInt(rows[i].team1game1) + parseInt(rows[i].team1game2);
                parseInt(rows[i].team2game1) > parseInt(rows[i].team1game1) ? lGamesWon++ : lGamesLost++;
                parseInt(rows[i].team2game2) > parseInt(rows[i].team1game2) ? lGamesWon++ : lGamesLost++;
               
                if(!isNaN(parseInt(rows[i].team2game3))){
                  parseInt(rows[i].team2game3) > parseInt(rows[i].team1game3)? lGamesWon++ : lGamesLost++;
                  lPointsWon = lPointsWon + parseInt(rows[i].team2game3);
                  lPointsLost = lPointsLost + parseInt(rows[i].team1game3);
                }

                if(rows[i].winner == team){
                  lMatchWon++;
                  lteamsbeaten = lteamsbeaten + `~${rows[i].team1}~`;
                }
              }
            }

            lMatchLost = rows.length - lMatchWon;

            var updateParams = [rows.length,
                                lMatchWon,
                                lMatchLost,
                                lGamesWon,
                                lGamesLost,
                                lPointsWon,
                                lPointsLost,
                                lteamsbeaten,
                                context.match.round,
                                context.match.group,
                                team
                                ];

            console.log(updateParams);
            connection.query(updateTeamStats, updateParams, function(err, result, fields) {
              cb(err);
            });
          }
        });
    }

    const updateTeamStats = function(cb){

      async.parallel([
        function(callback) {
            updateSingleTeamStats(context.match.team1, callback);
        },
        function(callback) {
            updateSingleTeamStats(context.match.team2, callback);
        }
      ],
      function(err, results) {
          cb(err);
      });
    }

    const rankGroupAsync = function(cb){
      rankGroup(connection, context.match.round, context.match.group, cb);
    }

    async.waterfall([
        startTransaction,
        isMatchAlreadyUpdated,
        updateMatchResult,
        updateTeamStats,
        rankGroupAsync
    ], function (err, result) {
    
        if(err){
            connection.rollback(function() {
                console.log('transaction rolled back');
                return connection.end();
            });
            reply({error : err.message});
        }else{
            connection.commit(function(err) {
                if (err) {
                        return connection.rollback(function() {
                        throw err;
                    });
                }
                console.log('transaction commit success!');
                return connection.end();
            });

            reply({success : true});
        }
    });
};