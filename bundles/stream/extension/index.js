const {OBSUtility} = require('nodecg-utility-obs');
const axios = require('axios');

module.exports = nodecg => {
	const obs = new OBSUtility(nodecg);
	const graphUrl = 'https://www.ultimedecathlon.com/graphql';

	nodecg.listenFor('loadRTMP', async query => {
		try {
			await obs.send("SetSourceSettings", {
				sourceName: 'player-' + query.id + '-rtmp',
				sourceSettings: {
					is_local_file: false,
					input: "rtmp://stream.ultimedecathlon.com/stream/" + query.runner,
				},
			});
		} catch (error) {
			nodecg.log.error(error);
		}
	});

	const fetchPbsReplicant = nodecg.Replicant('fetchPbs');
	nodecg.listenFor('fetchPbs', async query => {
		try {
			let results = {};

			const apiResponse = await axios.get(graphUrl, {
				params: {
					query: 'query AllPBs {  userCardInformations(season: ' + query.season + ', username: "Djodjino", showEmptyPb: true) {    pbList {      game {        name        groupment      }      time      score    }  }}'
				}
			});

			if (undefined !== apiResponse.data.data) {
				apiResponse.data.data.userCardInformations.pbList.forEach(function(PB){
					if (query.game === PB.game.name) {
						if ('grind' === PB.game.groupment || 'light' === PB.game.groupment) {
							results.light = {
								score: PB.score ? PB.score : 0,
								time: PB.time
							}
						} else if ('race' === PB.game.groupment || 'dark' === PB.game.groupment) {
							results.dark = {
								score: PB.score ? PB.score : 0,
								time: PB.time
							}
						}


					}
				})
			}

			fetchPbsReplicant.value = results;
		} catch (error) {
			nodecg.log.error(error);
		}
	});

	const fetchGamesListReplicant = nodecg.Replicant('fetchGamesList');
	const gamesGlyph = nodecg.Replicant('gamesGlyph');
	nodecg.listenFor('fetchGamesList', async query => {
		try {
			let results = [];
			let glyphs = [];

			let groupment = 'grind';
			if (9 === parseInt(query)) {
				groupment = 'light';
			}

			const apiResponse = await axios.get(graphUrl, {
				params: {
					query: 'query getGames {  activeSeasonGames (season: ' + query + ', groupment: "' + groupment + '") {    name pathInformation {      path      width    } }}',
				}
			});

			if (undefined !== apiResponse.data.data) {
				apiResponse.data.data.activeSeasonGames.forEach(function(game){
					results.push(game.name);
					glyphs.push({
						name: game.name,
						glyph: game.pathInformation,
					});
				})

				fetchGamesListReplicant.value = results;
				gamesGlyph.value = glyphs;
			}
		} catch (error) {
			nodecg.log.error(error);
		}
	});

	const gameInfos = nodecg.Replicant('getGameInfos');
	nodecg.listenFor('getGameInfos', async query => {
		try {
			let gameResult = {};

			let apiResponseLight = await axios.get(graphUrl, {
				params: {
					query: 'query gameInfos {  activeSeasonGames(season: ' + query.season + ', groupment: ' + (parseInt(query.season) === 9 ? "light" : "grind") + ') {    id    name    category  minScore maxScore    bestTime    middleTime    fewestTime    groupment    twitchName    hexColor    pathInformation {      path      width    }  }}'
				}
			});

			gameResult = aggregateGameInfos(query, apiResponseLight.data.data.activeSeasonGames, gameResult);

			let apiResponseDark = await axios.get(graphUrl, {
				params: {
					query: 'query gameInfos {  activeSeasonGames(season: ' + query.season + ', groupment: ' + (parseInt(query.season) === 9 ? 'dark' : 'race') + ') {    id    name    category  minScore maxScore   bestTime    middleTime    fewestTime    groupment    twitchName    hexColor    pathInformation {      path      width    }  }}'
				}
			});
			gameResult = aggregateGameInfos(query, apiResponseDark.data.data.activeSeasonGames, gameResult);

			gameInfos.value = gameResult;
		} catch (error) {
			nodecg.log.error(error);
		}
	});

	// const fetchPbAggregatedListReplicant = nodecg.Replicant('fetchPbAggregatedList');
	// nodecg.listenFor('fetchPbAggregatedList', async query => {
	// 	try {
	// 		let results = {};
	//
	// 		for (const [key, player] of Object.entries(query.players)) {
	// 			const apiResponse = await axios.get(graphUrl, {
	// 				params: {
	// 					query: 'query AllPBs {  userCardInformations(season: ' + query.season + ', username: "' + player + '", showEmptyPb: true) {    pbList {      game {        name        groupment      }      time      score    }  }}'
	// 				}
	// 			});
	//
	// 			apiResponse.data.data.userCardInformations.pbList.forEach(function(PB){
	// 				if (query.game === PB.game.name) {
	// 					if (!results[key]) {
	// 						results[key] = {
	// 							score: null,
	// 							time: null,
	// 						};
	// 					}
	//
	// 					if (!results[key].score || (PB.score && (PB.score < results[key].score))) {
	// 						results[key] = {
	// 							score: PB.score ? PB.score : 0,
	// 							time: PB.time
	// 						}
	// 					}
	// 				}
	// 			})
	// 		}
	//
	// 		fetchPbAggregatedListReplicant.value = results;
	// 	} catch (error) {
	// 		nodecg.log.error(error);
	// 	}
	// });

	function aggregateGameInfos(query, games, gameResult) {
		games.forEach(function(game){
			if (query.game === game.name) {
				gameResult.name = game.name;
				gameResult.hexColor = game.hexColor;
				gameResult.pathInformation = {
					path: game.pathInformation.path,
					width: game.pathInformation.width
				};

				if ('light' === game.groupment || 'grind' === game.groupment) {
					gameResult.light = {
						category: game.category,
						bestTime: game.bestTime,
						middleTime: game.middleTime,
						fewestTime: game.fewestTime,
						minScore: game.minScore,
						maxScore: game.maxScore,
					}
				} else {
					gameResult.dark = {
						category: game.category,
						bestTime: game.bestTime,
						middleTime: game.middleTime,
						fewestTime: game.fewestTime,
						minScore: game.minScore,
						maxScore: game.maxScore,
					}
				}
			}
		})

		return gameResult;
	}
}
