"use strict"

module.exports = function(basedir) {
    return [
      { 
        method: 'GET', 
        path: '/', 
        config: {
            auth: false,
            handler: function(request, reply) { 
                      reply.view('home/home', {title : 'Home', navHome : true});      
                    }
        }         
      },
      { 
        method: 'GET', 
        path: '/login', 
        config: {
            auth: false,
            handler: function(request, reply) { 
                      reply.view('home/login', {title : 'Login', navHome : true, next: request.params.next });      
                    }
        }         
      },
      { 
        method: 'POST', 
        path: '/login', 
        config: {
            auth: false,
            handler: {LoginHandler : {}}
        }
      },
      {
        method : 'GET',
        path : '/league/{round}',
        config: {
            auth: false,
            handler: {LeagueHandler : {"view" : "tourney/league"}}
        }
      },
      { 
        method: 'GET', 
        path: '/matches/{round}/{group?}', 
        config: {
            auth: false,
            handler: {MatchViewHandler : {"view" : "tourney/matches"}}
        }
      },
      { 
        method: 'GET', 
        path: '/matches/score/{matchId?}', 
        config: {
            handler: {MatchScoreHandler : {"view" : "tourney/score"}}
        }
      },
      { 
        method: 'GET', 
        path: '/matches/score/edit/{matchId?}', 
        config: {
            handler: {MatchScoreHandler : {"view" : "tourney/score", "mode" : "edit"}}
        }
      },
      { 
        method: 'GET', 
        path: '/initLeague', 
        config: {
            handler: {InitLeagueHandler : {}}
        }
      },
      { 
        method: 'GET', 
        path: '/rules', 
        config: {
            auth: false,
            handler: {ContentHandler : {"view" : "home/rules", "contentSlug" : "bbc-rules"}}
        }
      },
      { 
        method: 'POST', 
        path: '/matches/score', 
        config: {
            handler: {MatchSaveHandler : {}}
        }
      },
      { 
        method: 'POST', 
        path: '/matches/score/edit', 
        config: {
            handler: {EditScoreHandler : {}}
        }
      }
    ];
};
