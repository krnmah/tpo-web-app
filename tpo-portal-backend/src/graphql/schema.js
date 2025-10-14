const { makeExecutableSchema } = require('@graphql-tools/schema');
const studentTypeDef = require('./typeDefs/studentTypeDef');
const studentResolver = require('./resolvers/studentResolver');

module.exports = makeExecutableSchema({
  typeDefs: [studentTypeDef],
  resolvers: [studentResolver],
});
