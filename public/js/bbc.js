/* Contains general scripts that may be used in any page. 
 * If this file starts to get large it can be split into page-specific files. */

/* The following code is the Garber-Irish implementation, a way to run relevant JavaScript on page-load
 * based on the MVC action that produced the page. It's an unobtrusive approach, which means that the
 * code to call the relevant JavaScript functions is all here instead of being hardcoded into the HTML.
 * All this code needs from the page is data-controller and data-action attributes on the body tag.
 * Since JavaScript is case-sensitive, the controller and action names we use here must be an exact match.
 * http://viget.com/inspire/extending-paul-irishs-comprehensive-dom-ready-execution */


burlingtonBadminton = {
	common: {
        init: function () {

        }
    },

    score: {
        init: function () {

        },
        saveScore: function () {

        	var postUrl = "/matches/score";
        	if(matchDetails.editMode){
        		postUrl = "/matches/score/edit";
        	}
        	
			$('#btnGameOver').click(function() {
				if(UTIL.isGameOver()){
		        	var $gameOverModal = $("#gameOverModal");
					$gameOverModal.find('.mdlWinnerName').html(matchDetails.winnerName);
					$gameOverModal.find('.mdlWinnerScore').html(matchDetails.score);
					$gameOverModal.modal();
				}else{
					$("#badScoreModal").modal();
				}
			});        	

			$('#btnGameOverConfirm').click(function() {
				$.ajax({
					type: "POST",
					url: postUrl,
					data: matchDetails
				}).done(function(data) {
					if(data.success){
						window.location.href = "/league/" + matchDetails.round;
					}else{
						alert(data.error);
					}
				});
			});
        },
        selectMatch: function () {
        	var rounds = _.uniqBy(matchList, 'round');
			rounds.forEach(function(element) {
				var option = new Option(element.round, element.round); 
				$('#selectRound').append($(option));
			});

			$('#selectRound').on('change', function() {
			  	var selectedRound = this.value;
			  	var groups = _.uniqBy(_.filter(matchList, { 'round': selectedRound}), 'group');
			  	$('#selectGroup').children('option:not(:first)').remove();
				groups.forEach(function(element) {
					var option = new Option(element.group, element.group); 
					$('#selectGroup').append($(option));
				});
				$('#selectGroup').trigger('change');
			});

			$('#selectGroup').on('change', function() {
			  	var selectedGroup = this.value;
			  	var selectedRound = $('#selectRound').val();

			  	var matches = _.filter(matchList, { 'round': selectedRound, 'group': selectedGroup});
			  	$('#selectMatch').children('option:not(:first)').remove();
				matches.forEach(function(element) {
					var option = new Option(_.unescape(element.match), element.matchId); 
					$('#selectMatch').append($(option));
				});
			});

			$('#selectRound').trigger('change');

			var editLocation = "/matches/score/";
			if(window.location.href.indexOf("edit") > 0){
				editLocation = "/matches/score/edit/";
			}
			$('#btnSubmit').click(function() {
				var selectedMatch = $('#selectMatch').val();
				if(selectedMatch){
					window.location.href = editLocation + selectedMatch;
				};
			}); 
        },
    },
};

UTIL = {
    exec: function (controller, action) {
        var namespace = burlingtonBadminton;
        action = (action === undefined) ? "init" : action;

        if (controller !== "" && namespace[controller] && typeof namespace[controller][action] == "function") {
            namespace[controller][action]();
        }
    },

    init: function () {
        var body = document.body;
        var controller = body.getAttribute("data-controller");
        var action = body.getAttribute("data-action");

        UTIL.exec("common");
        UTIL.exec(controller);
        UTIL.exec(controller, action);
    },

    isGameOver: function () {
    	// Check the scores
    	matchDetails.t1g1 = parseInt($(".team1game1").val());
    	matchDetails.t1g2 = parseInt($(".team1game2").val());
    	matchDetails.t1g3 = parseInt($(".team1game3").val());
    	matchDetails.t2g1 = parseInt($(".team2game1").val());
    	matchDetails.t2g2 = parseInt($(".team2game2").val());
    	matchDetails.t2g3 = parseInt($(".team2game3").val());

    	if(	isNaN(matchDetails.t1g1) ||
    		isNaN(matchDetails.t1g2) ||
    		isNaN(matchDetails.t2g1) ||
    		isNaN(matchDetails.t2g2)){
    		return false;
    	}

    	var lScore = "",
    		lt1 = 0,
    		lt2 = 0;

    	if(matchDetails.t1g1 > matchDetails.t2g1){
    		if(UTIL.isGameScoreValid(matchDetails.t1g1, matchDetails.t2g1)){
    			lScore = lScore + '(' + matchDetails.t1g1 + '-' + matchDetails.t2g1 + ') ';
    			lt1++;
    		}else{
    			return false;
    		}
    	}else{
			if(UTIL.isGameScoreValid(matchDetails.t2g1, matchDetails.t1g1)){
    			lScore = lScore + '(' + matchDetails.t2g1 + '-' + matchDetails.t1g1 + ') ';
    			lt2++;
    		}else{
    			return false;
    		}
    	}

    	if(matchDetails.t1g2 > matchDetails.t2g2){
    		if(UTIL.isGameScoreValid(matchDetails.t1g2, matchDetails.t2g2)){
    			lScore = lScore + '(' + matchDetails.t1g2 + '-' + matchDetails.t2g2 + ') ';
    			lt1++;
    		}else{
    			return false;
    		}
    	}else{
			if(UTIL.isGameScoreValid(matchDetails.t2g2, matchDetails.t1g2)){
    			lScore = lScore + '(' + matchDetails.t2g2 + '-' + matchDetails.t1g2 + ') ';
    			lt2++;
    		}else{
    			return false;
    		}
    	}

    	if(lt1 == lt2){
	    	if(	isNaN(matchDetails.t1g3) ||
	    		isNaN(matchDetails.t1g3)){
	    		return false;
	    	}

	    	if(matchDetails.t1g3 > matchDetails.t2g3){
	    		if(UTIL.isGameScoreValid(matchDetails.t1g3, matchDetails.t2g3)){
	    			lScore = lScore + '(' + matchDetails.t1g3 + '-' + matchDetails.t2g3 + ') ';
	    			lt1++;
	    		}else{
	    			return false;
	    		}
	    	}else{
				if(UTIL.isGameScoreValid(matchDetails.t2g3, matchDetails.t1g3)){
	    			lScore = lScore + '(' + matchDetails.t2g3 + '-' + matchDetails.t1g3 + ') ';
	    			lt2++;
	    		}else{
	    			return false;
	    		}
	    	}
    	}

    	matchDetails.score = lScore;

    	if(lt1 > lt2){
    		matchDetails.winner = matchDetails.team1Id;
    		matchDetails.winnerName = matchDetails.team1Name;
    	}else{
    		matchDetails.winner = matchDetails.team2Id;
    		matchDetails.winnerName = matchDetails.team2Name;
    	}

    	return true;
    },

    isGameScoreValid: function (winnerScore, loserScore) {
    	if(winnerScore < loserScore){return false;}
    	if(winnerScore < 21 || winnerScore > 30){return false;}
    	if(winnerScore < 30 && (winnerScore - loserScore < 2)){return false;}
    	if(winnerScore > 21 && (winnerScore - loserScore > 2)){return false;}
    	return true;
    }
};

$(document).ready(UTIL.init);
/* END: Garber-Irish */