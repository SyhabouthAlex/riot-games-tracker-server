const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const mongoose = require('mongoose');

const typeDefs = require('./graphql/typeDefs')
const { MONGODB } = require('./config');
const Player = require('./models/Player');
const resolvers = {
    Query: {
        async findPlayer(){
            try{
                const players = await Player.find();
                return players;
            }
            catch (e) {
                throw new Error(e);
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
});

mongoose.connect(MONGODB, { useUnifiedTopology: true, useNewUrlParser: true })
.then(() => server.listen({ port: 5000 }))
.then(res => console.log(`Server running at ${res.url}`))

