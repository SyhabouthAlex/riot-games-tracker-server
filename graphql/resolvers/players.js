const Player = require('../../models/Player');
const LolMatch = require('../../models/LolMatch');
const TftMatch = require('../../models/TftMatch');
const axios = require('axios');
const { TOKEN } = require('../../config');

const PROFILE_URL = "https://na1.api.riotgames.com/tft/summoner/v1/summoners/";
const TFT_MATCH_URL = "https://americas.api.riotgames.com/tft/match/v1/matches/"
const LOL_MATCH_URL = "https://na1.api.riotgames.com/lol/match/v4/"

const options = {
    headers: {
        'X-Riot-Token': TOKEN
    }
}

// Input: Either player name or player ID or player account ID
// Output: Existing player object with updated name if the player already exists in database
// otherwise a new player object created from Riot API data.
async function getPlayerData(identifiers) {
    const identifier = identifiers.name || identifiers.id || identifiers.accId;
    const identifierURL = identifiers.name ? "by-name/" : identifiers.id ? "by-puuid/" : "by-account/";
    const response = await axios.get(`${PROFILE_URL}${identifierURL}${identifier}`, options);
    if (response.data.status_code === 404) {
        throw new UserInputError('Player is not found', {
            errors: {
                playerName: 'Player is not found'
            }
        });
    }

    // Possible the player could already be in the database under a previous name but has since
    // changed their name since they last updated their profile. Update the name then return the existing
    // player profile.
    const player = await Player.findById(response.data.puuid);
    if (player) {
        if (player.playerName === response.data.name) {
            return player;
        }
        player.playerName = response.data.name;
        return player;
    }
    return response.data;
}

// Input: MongoDB player object
// Output: Player object with TftMatches and LolMatches added for GraphQL endpoint
async function returnPlayerData(player) {
    const playerTftMatches = await TftMatch.find({_id: {$in: player.tftMatches}});
    const playerLolMatches = await LolMatch.find({_id: {$in: player.lolMatches}});
    return {
        id: player._id,
        ...player._doc,
        tftMatches: playerTftMatches,
        lolMatches: playerLolMatches
    }
}

// Input: Player information from Riot Games API
// Output: New MongoDB player object
async function createNewPlayer(_id, accountId, playerName, level, avatarId) {
    const player = await Player.findById(_id);
    if (!player) {
        const newPlayer = new Player({
            _id,
            accountId,
            playerName,
            level,
            avatarId,
            lastRefreshed: 0,
            tftMatches: [],
            lolMatches: []
        });
    
        const res = await newPlayer.save();
        return res;
    }
    else {
        throw new Error("Player already exists in database", {
            errors: {
                alreadyExists: "Player already exists in database"
            }
        })
    }
}

// Input: Tft match IDs, MongoDB player object
// Output: None
// Updates player TftMatch IDs array, creates an array of Tft match data that is passed in to updateTftMatches, 
// checks to see if matches are already in database before adding them to the array
async function getTftMatchData(data, player) {
    const tftMatchIds = [...data];
    player.tftMatches = tftMatchIds;

    const tftResults = [];
    for (const id of tftMatchIds) {
        const data = await axios.get(`${TFT_MATCH_URL}${id}`, options);
        tftResults.push(data);
    }

    await updateTftMatches(tftResults);
}

// Input: Lol match IDs, MongoDB player object
// Output: None
// Updates player LolMatch IDs array, creates an array of Lol match data that is passed in to updateLolMatches, 
// checks to see if matches are already in database before adding them to the array
async function getLolMatchData(data, player) {
    const lolMatchIds = [];
    data.matches.forEach(v => lolMatchIds.push(v.gameId))                                
    player.lolMatches = lolMatchIds;
    const lolResults = [];
    for (const id of lolMatchIds) {
        const data = await axios.get(`${LOL_MATCH_URL}matches/${id}`, options);
        lolResults.push(data);
    }
    await updateLolMatches(lolResults);
}

// Input: Array of Tft match data from Riot Games API
// Output: None
// Updates database with new match data if match didn't previously exist
async function updateTftMatches(tftMatches) {
    const matches = [];
    for (const tftMatch of tftMatches) {
        const exists = await TftMatch.findById(tftMatch.data.metadata.match_id);
        if (!exists) {
            const participants = [];
            for (const participant of tftMatch.data.info.participants) {
                let summonerName;
                const playerData = await getPlayerData({ id : participant.puuid });
                if (!playerData.playerName) {
                    const newPlayer = (
                        await createNewPlayer(playerData.puuid, playerData.accountId, playerData.name, 
                        playerData.summonerLevel, playerData.profileIconId)
                    )
                    summonerName = newPlayer.playerName;
                }
                else summonerName = playerData.playerName;

                const traits = [];
                for (const trait of participant.traits) {
                    const traitObj = {
                        name: trait.name,
                        numUnits: trait.num_units,
                        style: trait.style
                    }
                    traits.push(traitObj)
                };

                const units = [];
                for (const unit of participant.units) {
                    const unitObj = {
                        characterId: unit.character_id,
                        rarity: unit.rarity,
                        tier: unit.tier,
                        chosen: unit.chosen || "",
                        itemIds: unit.items
                    }
                    units.push(unitObj)
                };

                const participantObj = {
                    puuid: participant.puuid,
                    summonerName,
                    goldLeft: participant.gold_left,
                    lastRound: participant.last_round,
                    level: participant.level,
                    placement: participant.placement,
                    traits,
                    units
                }
                participants.push(participantObj);
            }

            const match = new TftMatch({
                _id: tftMatch.data.metadata.match_id,
                setNumber: tftMatch.data.info.tft_set_number,
                gameTime: tftMatch.data.info.game_datetime,
                gameLength: tftMatch.data.info.game_length,
                gameVariation: tftMatch.data.info.game_variation || -1,
                queueId: tftMatch.data.info.queue_id,
                participants
            });
            matches.push(match.save());
        } 
    }
    await Promise.all(matches);
}

// Input: Array of Lol match data from Riot Games API
// Output: None
// Updates database with new match data if match didn't previously exist
async function updateLolMatches(lolMatches) {
    const matches = [];
    for (const lolMatch of lolMatches) {
        const exists = await LolMatch.findById(lolMatch.data.gameId);
        if (!exists) {
            const participants = [];
            for (let i = 0; i < 10; i++) {
                participants.push({
                    accountId: lolMatch.data.participantIdentities[i].player.accountId,
                    summonerName: lolMatch.data.participantIdentities[i].player.summonerName,
                    championId: lolMatch.data.participants[i].championId,
                    teamId: lolMatch.data.participants[i].teamId,
                    spell1Id: lolMatch.data.participants[i].spell1Id,
                    spell2Id: lolMatch.data.participants[i].spell2Id,
                    stats: {
                        item0Id: lolMatch.data.participants[i].stats.item0,
                        item1Id: lolMatch.data.participants[i].stats.item1,
                        item2Id: lolMatch.data.participants[i].stats.item2,
                        item3Id: lolMatch.data.participants[i].stats.item3,
                        item4Id: lolMatch.data.participants[i].stats.item4,
                        item5Id: lolMatch.data.participants[i].stats.item5,
                        item6Id: lolMatch.data.participants[i].stats.item6,
                        kills: lolMatch.data.participants[i].stats.kills,
                        deaths: lolMatch.data.participants[i].stats.deaths,
                        assists: lolMatch.data.participants[i].stats.assists,
                        goldEarned: lolMatch.data.participants[i].stats.goldEarned,
                        totalMinionsKilled: lolMatch.data.participants[i].stats.totalMinionsKilled + lolMatch.data.participants[i].stats.neutralMinionsKilled,
                        win: lolMatch.data.participants[i].stats.win
                    }
                })
            };

            const match = new LolMatch({
                _id: lolMatch.data.gameId,
                gameType: lolMatch.data.gameType,
                gameMode: lolMatch.data.gameMode,
                queueId: lolMatch.data.queueId,
                mapId: lolMatch.data.mapId,
                gameCreationTime: lolMatch.data.gameCreation,
                gameDuration: lolMatch.data.gameDuration,
                participants
            });
            matches.push(match.save());
        }
    }
    await Promise.all(matches);
}

module.exports = {
    Query: {
        async getPlayer(_, { playerName }){
            try {
                const player = await Player.findOne({ playerName: playerName }).collation({ locale: 'en', strength: 2 });
                if (player) {
                    return await returnPlayerData(player);
                }
                // If player is not in database, send request to Riot API in case player exists
                // but is not in database yet
                else {
                    const playerInput = await getPlayerData({ name: playerName });
                    if (playerInput.playerName) {
                        return await returnPlayerData(playerInput);
                    }
                    return (
                        await createNewPlayer(playerInput.puuid, playerInput.accountId, playerInput.name, 
                        playerInput.summonerLevel, playerInput.profileIconId)
                    )
                }
            }
            catch (e) {
                throw new Error('Player was not found',
                {
                    errors: {
                        notFound: 'Player was not found'
                    }
                });
            }
        }
    },
    Mutation: {
        async refreshPlayer(_, { playerId, accountId }) {
            const player = await Player.findById(playerId);
            try {
                if (Date.now() - player.lastRefreshed > 0) {
                    const tftMatchData = await axios.get(`${TFT_MATCH_URL}by-puuid/${playerId}/ids`, options);;
                    let lolMatchData;

                    // Since the API throws a 404 if no match data exists (even if the player exists)
                    // using try catch so it won't break code (Gets matches only within the past 6 months)
                    try {
                        lolMatchData = await axios.get(`${LOL_MATCH_URL}matchlists/by-account/${accountId}?beginTime=${Date.now() - 15552000000}&endIndex=20`, options);
                    }
                    catch {
                        lolMatchData = false
                    }

                    await getTftMatchData(tftMatchData.data, player);
                    if (lolMatchData) await getLolMatchData(lolMatchData.data, player);

                    player.lastRefreshed = Date.now();
                    await player.save();

                    return await returnPlayerData(player);
                }
                else {
                    throw new Error('You can only refresh once every 10 minutes',
                    {
                        errors: {
                            tooEarly: 'You can only refresh once every 10 minutes'
                        }
                    });
                }
            }
            catch (e) {
                throw new Error(e);
            }
        }
    }
}