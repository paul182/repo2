"use strict"

const async = require('async');
const firstBy = require('thenby');

module.exports = (connection, round, group, cb) => {
        const leagueQuery = `select t1.team, won AS matchPoint, 
            (gamesWon-gamesLost) AS gamePoint, 
            (pointsWon - pointsLost) AS pointDiff,
            IFNULL(teamsBeaten, "") AS teamsBeaten
            from league t1 
            where round = '${round}' and t1.group = '${group}'
            order by matchPoint desc, gamePoint desc, pointDiff desc`;

        const updateStanding = function(row, idx, cb){
            const updateStandingQuery = `update league l set 
                l.standing = ${idx} + 1
                where round = '${round}' and l.group = '${group}' and team = '${row.team}'`;

            connection.query(updateStandingQuery, function(err, result, fields) {
                cb(err);
            });        
        }

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
};