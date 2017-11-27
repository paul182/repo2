"use strict";

const firstBy = require('thenby');

var rows = [
	{team: 2, matchPoint: 2, gamePoint: 2, pointDiff: 2, teamsBeaten: '~4~~1~'},
	{team: 3, matchPoint: 2, gamePoint: 7, pointDiff: 22, teamsBeaten: '~1~~1~~2~~4~'},	
	{team: 1, matchPoint: 2, gamePoint: 2, pointDiff: 20, teamsBeaten: '~4~'},
	{team: 4, matchPoint: 2, gamePoint: , pointDiff: -44, teamsBeaten: ''}
];

var sortedRows = rows.sort(
    firstBy("matchPoint", {direction:-1})
    .thenBy(function (v1, v2) {console.log(`~${v2.team}~  : ${v1.teamsBeaten}  :  `); return v2.teamsBeaten.indexOf(`~${v1.team}~`); })
    .thenBy("gamePoint", {direction:-1})
    .thenBy("pointDiff", {direction:-1})
);

console.log(sortedRows);