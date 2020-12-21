const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');

const { validateRegisterInput, validateLoginInput } = require('../../utilities/validators');
const { SECRET_KEY } = require('../../config');
const checkAuth = require('../../utilities/checkAuth');
const User = require('../../models/User');
const Player = require('../../models/Player');

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username
        }, SECRET_KEY, { expiresIn: '7d' });
}

module.exports = {
    Mutation: {
        async register(_, {registerInput: {username, email, password, confirmPassword}}) {
            const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword);

            if (!valid) {
                throw new UserInputError('Errors', { errors });
            }
            const user = await User.findOne({ username });
            if (user) {
                throw new UserInputError('Username is unavailable', {
                    errors: {
                        username: 'This username is unavailable'
                    }
                });
            }

            const hashedPw = await bcrypt.hash(password, 12);

            const newUser = new User({
                email,
                username,
                hashedPw,
                favoritePlayers: []
            });

            const res = await newUser.save();

            const token = generateToken(res);

            return {
                ...res._doc,
                id: res._id,
                token
            };
        },
        async login(_, { username, password }) {
            const { errors, valid } = validateLoginInput(username, password);
            if (!valid) {
                throw new UserInputError('Errors', { errors });
            }

            const user = await User.findOne({ username });
            if (!user) {
                errors.general = 'User not found';
                throw new UserInputError('User not found', { errors });
            }

            const validPw = await bcrypt.compare(password, user.password);
            if (!validPw) {
                errors.general = 'Incorrect password';
                throw new UserInputError('Incorrect password', { errors });
            }

            const token = generateToken(user);

            return {
                ...user._doc,
                id: user._id,
                token
            };
        },
        async addOrRemoveFavorite(_, { playerId }, context) {
            const auth = checkAuth(context);
            const user = await User.findById(auth.id);
            const player = await Player.findById(playerId);

            if (player) {
                if (user.favoritePlayers.find(favPlayer => favPlayer === player.id)) {
                    user.favoritePlayers = user.favoritePlayers.filter(favPlayer => favPlayer !== player.id);
                }
                else {
                    user.favoritePlayers.push(player.id);
                }
                await user.save();
                const favoritePlayers = await Player.find({_id: {$in: user.favoritePlayers}});
                return {
                    ...user._doc,
                    favoritePlayers
                };
            }
            else throw new UserInputError('Player not found')
        }
    }
};