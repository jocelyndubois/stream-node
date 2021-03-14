const season = nodecg.Replicant('season');
const game = nodecg.Replicant('game');
const gamesGlyph = nodecg.Replicant('gamesGlyph');

const fetchPbsReplicant = nodecg.Replicant('fetchPbs');

const backgrounds = nodecg.Replicant('assets:background');
const background = nodecg.Replicant('background');

const clips = nodecg.Replicant('assets:clips');
const clip = nodecg.Replicant('clip');

const gameInfos = nodecg.Replicant('getGameInfos');

const fetchGamesListReplicant = nodecg.Replicant('fetchGamesList');

//[GAMES/SEASON Modifs]
// game.on('change', (newGame) => {
// 	fetchPBList();
// });
