"use strict";
const mysql = require('mysql');
const _ = require('lodash');

module.exports = (options, server, request, reply) => {

    const context = {};
    context.navScore = true;
    context.title = "Admin: Update match score";
    context.editMode = options.mode == "edit"? true : false;
    

    // View for displaying the blank score card

    var connection = mysql.createConnection(server.settings.app.dbUrl);
    connection.connect();

    if(request.params.matchId){
      context.page = {controller: "score", action: "saveScore"};

      const matchQuery = `select m.round, m.id, m.group, a.Name AS team1Name, 
      b.Name AS team2Name, a.Id AS team1, b.Id AS team2,
      DATE_FORMAT(IFNULL(m.gameTS, m.matchDate), "%Y-%m-%d") AS matchDate,
      m.team1game1, m.team1game2, m.team1game3,
      m.team2game1, m.team2game2, m.team2game3, m.winner
      FROM team a INNER JOIN matches m ON m.team1 = a.id
      INNER JOIN team b ON m.team2 = b.id
      where m.id = '${request.params.matchId}'`;

      connection.query(matchQuery, function(err, rows, fields) {
        if (err) throw err;
        context.match = rows[0];
        if(!context.editMode && !context.match.winner){
          context.editMode = true;
        }
        reply.view(options.view, context);
        return connection.end();
      });
    }else{
        context.page = {controller: "score", action: "selectMatch", needLoDash: true};

        const matchesQuery = `select m.round, m.id, m.group, a.Name AS team1Name, 
        b.Name AS team2Name
        FROM team a INNER JOIN matches m ON m.team1 = a.id
        INNER JOIN team b ON m.team2 = b.id
        where m.winner is ${context.editMode? "NOT" : ""} null`;

        connection.query(matchesQuery, function(err, rows, fields) {
          if (err) throw err;          
          context.matches = rows;          
          reply.view("tourney/teamSelect", context);
          return connection.end();
        });
    }


    /* TODO:
     * - Add login validation
     * - If match Id is present, show the match score view else show the picker view
     * - Get unplayed games to construct unique round / group / matches
     */


};