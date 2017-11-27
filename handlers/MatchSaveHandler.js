"use strict";
const async = require('async');
const mysql = require('mysql');
const _ = require('lodash');
const firstBy = require('thenby');

module.exports = (options, server, request, reply) => {

    // Saves the match score in the DB. Calculates the group standings

    /* TODO:
     * - Add login validation
     */
   
    var connection = mysql.createConnection(server.settings.app.dbUrl),
        context = {};

    const startTransaction = function(cb){
        connection.beginTransaction(function(err) {
          if (err) { console.log('startTransaction error ' + err); }
          cb(err);
        });
    }

    const isMatchAlreadyUpdated = function(cb){
        const currentMatcheQuery = `select m.round, m.group, m.gameTS, m.winner
        FROM matches m where m.id = ${request.payload.matchId}`;

        connection.query(currentMatcheQuery, function(err, rows, fields) {
          if (err) {
            cb(err);
          }else if(rows.length < 1){
            cb(new Error('Match not found'));
          }else if(rows[0].winner){
            cb(new Error('Match alreay saved. Result not updated'));
          }else{
            context.match = {};
            context.match.round = rows[0].round;
            context.match.group = rows[0].group;
            cb(null);
          }
        });        
    }

    const updateMatchResult = function(cb){
        const matchUpdateQuery = `update matches set team1game1 = ?, team1game2 = ?, team1game3 = ?,
            team2game1 = ?, team2game2 = ?, team2game3 = ?, winner = ?, gameTS = now() where id = ${request.payload.matchId}`;

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

    const updateTeamStats = function(cb){

        const matchTeamStats = `update league l set 
            l.played = l.played + 1,
            l.won = l.won + ?,
            l.lost = l.lost + ?,
            l.gamesWon = l.gamesWon + ?,
            l.gamesLost = l.gamesLost + ?,
            l.pointsWon = l.pointsWon + ?,
            l.pointsLost = l.pointsLost + ?,
            l.teamsBeaten = CONCAT(IFNULL(l.teamsBeaten, ""), ?)
            where round = ? and l.group = ? and team = ?`;

        var t1GamesWon = 0,
            t2GamesWon = 0,
            t1Points = 0,
            t2Points = 0;
        request.payload.t1g1 > request.payload.t2g1? t1GamesWon++ : t2GamesWon++;
        request.payload.t1g2 > request.payload.t2g2? t1GamesWon++ : t2GamesWon++;
        if(!isNaN(request.payload.t1g3)){
            request.payload.t1g3 > request.payload.t2g3? t1GamesWon++ : t2GamesWon++;
            t1Points = t1Points + parseInt(request.payload.t1g3);
            t2Points = t2Points + parseInt(request.payload.t2g3);
        }
        t1Points = t1Points + parseInt(request.payload.t1g1) + parseInt(request.payload.t1g2);
        t2Points = t2Points + parseInt(request.payload.t2g1) + parseInt(request.payload.t2g2);

        var t1Params = [request.payload.team1Id == request.payload.winner ? 1 : 0,
                      request.payload.team1Id == request.payload.winner ? 0 : 1,
                      t1GamesWon,
                      t2GamesWon,
                      t1Points,
                      t2Points,
                      request.payload.team1Id == request.payload.winner ? `~${request.payload.team2Id}~` : '',
                      context.match.round,
                      context.match.group,
                      request.payload.team1Id                    
                    ];

        var t2Params = [request.payload.team2Id == request.payload.winner ? 1 : 0,
                      request.payload.team2Id == request.payload.winner ? 0 : 1,
                      t2GamesWon,
                      t1GamesWon,
                      t2Points,
                      t1Points,
                      request.payload.team2Id == request.payload.winner ? `~${request.payload.team1Id}~` : '',
                      context.match.round,
                      context.match.group,
                      request.payload.team2Id                    
                    ];

        async.parallel([
            function(cb) {
                connection.query(matchTeamStats, t1Params, function(err, result, fields) {
                  cb(err);
                });
            },
            function(cb) {
                connection.query(matchTeamStats, t2Params, function(err, result, fields) {
                  cb(err);
                });
            }
        ],
        function(err, results) {
            cb(err);
        });
    }

    const rankGroup = function(cb){

        const leagueQuery = `select t1.team, won AS matchPoint, 
            (gamesWon-gamesLost) AS gamePoint, 
            (pointsWon - pointsLost) AS pointDiff,
            IFNULL(teamsBeaten, "") AS teamsBeaten
            from league t1 
            where round = '${context.match.round}' and t1.group = '${context.match.group}'
            order by matchPoint desc, gamePoint desc, pointDiff desc`;

        connection.query(leagueQuery, function(err, rows, fields) {
            if (err) {
                cb(err);
            }else {
                var currentStand = 1;

                var sortedRows = rows.sort(
                    firstBy("matchPoint", {direction:-1})
                    .thenBy(function (v1, v2) {return v2.teamsBeaten.indexOf(`~${v1.team}~`); })
                    .thenBy("gamePoint", {direction:-1})
                    .thenBy("pointDiff", {direction:-1})
                );

                async.eachOf(sortedRows, updateStanding, function(err){
                  cb(err);
                });                
            }
        });
    }

    const updateStanding = function(row, idx, cb){
        const updateStandingQuery = `update league l set 
            l.standing = ${idx} + 1
            where round = '${context.match.round}' and l.group = '${context.match.group}' and team = '${row.team}'`;

        connection.query(updateStandingQuery, function(err, result, fields) {
            cb(err);
        });        
    }

    async.waterfall([
        startTransaction,
        isMatchAlreadyUpdated,
        updateMatchResult,
        updateTeamStats,
        rankGroup
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