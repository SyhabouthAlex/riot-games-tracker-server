const { model, Schema } = require('mongoose');
const lolMatchSchema = new Schema({
    _id: String,
    gameType: String,
    gameMode: String,
    queueId: Number,
    mapId: Number,
    gameCreationTime: Number,
    gameDuration: Number,
    participants: [
        {
            accountId: String,
            summonerName: String,
            championId: Number,
            teamId: Number,
            spell1Id: Number,
            spell2Id: Number,
            stats: {
                item0Id: Number,
                item1Id: Number,
                item2Id: Number,
                item3Id: Number,
                item4Id: Number,
                item5Id: Number,
                item6Id: Number,
                kills: Number,
                deaths: Number,
                assists: Number,
                goldEarned: Number,
                totalMinionsKilled: Number,
                win: Boolean
            }
        }
    ]
})

module.exports = model("LolMatch", lolMatchSchema);