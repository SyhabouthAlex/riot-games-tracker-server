const { gql } = require('apollo-server');

module.exports = gql`
    type Player {
        id: String!
        accountId: String!
        playerName: String!
        level: Int!
        avatarId: Int!
        lastRefreshed: Float!
        tftMatches: [TftMatch]!
        lolMatches: [LolMatch]!
    }
    type TftMatch {
        id: String!
        setNumber: Int!
        gameTime: Float!
        gameLength: Float!
        gameVariation: Int!
        queueId: Int!
        participants: [TftParticipant]
    }
    type TftParticipant {
        summonerName: String!
        goldLeft: Int!
        lastRound: Int!
        level: Int!
        placement: Int!
        traits: [TftTrait]
        units: [TftUnit]
    }
    type TftTrait {
        name: String!
        numUnits: Int!
        style: Int!
    }
    type TftUnit {
        characterId: String!
        rarity: Int!
        tier: Int!
        chosen: String!
        itemIds: [Int]
    }
    type LolMatch {
        id: String!
        gameType: String!
        gameMode: String!
        queueId: Int!
        mapId: Int!
        gameCreationTime: Float!
        gameDuration: Float!
        participants: [LolParticipant]
    }
    type LolParticipant {
        summonerName: String!
        championId: Int!
        teamId: Int!
        spell1Id: Int!
        spell2Id: Int!
        stats: LolParticipantStats!
    }
    type LolParticipantStats {
        item0Id: Int!
        item1Id: Int!
        item2Id: Int!
        item3Id: Int!
        item4Id: Int!
        item5Id: Int!
        item6Id: Int!
        kills: Int!
        deaths: Int!
        assists: Int!
        goldEarned: Int!
        totalMinionsKilled: Int!
        win: Boolean!
    }
    type User {
        id: ID!
        username: String!
        email: String!
        token: String!
        favoritePlayers: [Player]
    }
    input RegisterInput {
        username: String!
        email: String!
        password: String!
        confirmPassword: String!
    }
    type Query {
        getPlayer(playerName: String!): Player
    }
    type Mutation {
        register(registerInput: RegisterInput): User!
        login(username: String!, password: String!): User!
        refreshPlayer(playerId: String!, accountId: String!): Player!
        addOrRemoveFavorite(playerId: String!): User!
    }
`