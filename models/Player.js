const { model, Schema } = require('mongoose');

const playerSchema = new Schema({
    _id: String,
    username: String,
    level: Number,
    avatar: Number,
    tftMatches: [
        {
            type: Schema.Types.String,
            ref: 'tftMatches'
        }
    ],
    lolMatches: [
        {
            type: Schema.Types.String,
            ref: 'lolMatches'
        }
    ]
})

module.exports = model("Player", playerSchema);