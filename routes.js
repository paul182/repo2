"use strict"

const _ = require('lodash');

module.exports = function(basedir) {
    return [
      { 
        method: 'GET', 
        path: '/', 
        handler: function(request, reply) {      
          reply.view('home/home', {title : 'Home'});      
        } 
      },
      {
        method : 'GET',
        path : '/league/{round}',
        config: {
            handler: {LeagueHandler : {"view" : "tourney/league"}}
        }
      },
      { 
        method: 'GET', 
        path: '/matches/{round}/{group?}', 
        config: {
            handler: {MatchViewHandler : {"view" : "tourney/matches"}}
        }
      },
      { 
        method: 'GET', 
        path: '/matches/score/{matchId}', 
        config: {
            handler: {MatchScoreHandler : {"view" : "tourney/score"}}
        }
      }
    ];
};
