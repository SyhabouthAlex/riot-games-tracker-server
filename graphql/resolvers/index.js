const playersResolvers = require('./players');
const userResolvers = require('./users')

module.exports = {
    Query: {
        ...playersResolvers.Query
    },
    Mutation: {
        ...userResolvers.Mutation,
        ...playersResolvers.Mutation
    }
}