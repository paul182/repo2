"use strict";
var robin = require('roundrobin');
const mysql = require('mysql');
const _ = require('lodash');
const config = require('../config');
const async = require('async');

/*
 * TODO: INsers the matches records for round robin stage
 * Invocation: 
 * node matches.js <round> <group> <date>
 */

var myArgs = process.argv.slice(2);

if (typeof myArgs === "undefined" || myArgs.length != 3) {
	console.log("Round, Group and Match Date are required input params");
	process.exit(0);
}

// Get the players for the round / group
const robinSelect = `select t1.team from league t1 where round = '${myArgs[0]}' and t1.group = '${myArgs[1]}'`;
const matchExists = `select 1 from matches t1 where round = '${myArgs[0]}' and t1.group = '${myArgs[1]}'`;

var connection = mysql.createConnection(config.dbUrl);
connection.connect();

async.waterfall([
    fnMatchExists,
    fnRobinSelect,
    fnInsertMatches
], function (err, result) {
    connection.end();

    if(err){
    	console.log('Error : ' + err);
    }else{
    	console.log('End of process : ' + result)
    }
});

function fnMatchExists(callback) {
	connection.query(matchExists, function(err, rows, fields) {
		if (err) throw err;
		if(rows.length > 0){
			throw new Error(`Matches already exists for round ${myArgs[0]} group ${myArgs[1]}`);
		}

		callback(null);
	});    
};

function fnRobinSelect(callback) {
	connection.query(robinSelect, function(err, rows, fields) {
		if (err) throw err;

		var teamArray = _.map(rows, 'team');
		var matches = robin(teamArray.length, teamArray);
		var flattened = _.flatten(matches); 

		callback(null, flattened);
	});    
};

function fnInsertMatches(matches, callback) {

	matches.forEach(function(item) {

		var insertQuery = `insert into matches (round, matches.group, team1, team2, matchDate) 
			values('${myArgs[0]}', '${myArgs[1]}', ${item[0]}, ${item[1]}, '${myArgs[2]}')`;

		connection.query(insertQuery, function (error, results, fields) {
		  if (error) throw error;
		});
	});

	callback(null);
};