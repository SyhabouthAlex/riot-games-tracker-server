const { gql } = require('apollo-server');

module.exports = gql`
    type Player{
        _id: String
        username: String
        level: Int
        avatar: Int
        tftMatches: [String]
    }
    type Query{
        findPlayer: [Player]
    }
`