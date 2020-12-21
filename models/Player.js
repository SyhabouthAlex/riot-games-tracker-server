const { model, Schema } = require('mongoose');

const playerSchema = new Schema({
    _id: String,
    accountId: String,
    playerName: String,
    level: Number,
    avatarId: Number,
    lastRefreshed: Number,
    tftMatches: [
        {
            type: Schema.Types.String,
            ref: 'tftmatches'
        }
    ],
    lolMatches: [
        {
            type: Schema.Types.String,
            ref: 'lolmatches'
        }
    ]
})

module.exports = model("Player", playerSchema);