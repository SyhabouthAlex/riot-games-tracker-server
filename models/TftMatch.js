const { model, Schema } = require('mongoose');

const tftMatchSchema = new Schema({
    _id: String,
    setNumber: Number,
    gameTime: Number,
    gameLength: Number,
    gameVariation: Number,
    queueId: Number,
    participants: [
        {
            puuid: String,
            summonerName: String,
            goldLeft: Number,
            lastRound: Number,
            level: Number,
            placement: Number,
            traits: [
                {
                    name: String,
                    numUnits: Number,
                    style: Number
                }
            ],
            units: [
                {
                    characterId: String,
                    rarity: Number, 
                    tier: Number,
                    chosen: String,
                    itemIds: [Number]
                }
            ]
        }
    ]
})

module.exports = model("TftMatch", tftMatchSchema);