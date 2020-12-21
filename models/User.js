const { model, Schema } = require('mongoose');

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  favoritePlayers: [
    {
        type: Schema.Types.String,
        ref: 'players'
    }
]
});

module.exports = model('User', userSchema);