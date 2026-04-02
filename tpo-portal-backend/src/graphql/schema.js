const { makeExecutableSchema } = require('@graphql-tools/schema');
const userTypeDef = require('./typeDefs/userTypeDef');
const authTypeDef = require('./typeDefs/authTypeDef');
const companyTypeDef = require('./typeDefs/companyTypeDef');
const jobTypeDef = require('./typeDefs/jobTypeDef');
const applicationTypeDef = require('./typeDefs/applicationTypeDef');
const statsTypeDef = require('./typeDefs/statsTypeDef');
const baseTypeDef = require('./typeDefs/baseTypeDef');

module.exports = makeExecutableSchema({
  typeDefs: [
    baseTypeDef, 
    userTypeDef,
    authTypeDef,
    companyTypeDef,
    jobTypeDef,
    applicationTypeDef,
    statsTypeDef
  ],
  resolvers: [
    require('./resolvers/authResolver'),
    require('./resolvers/userResolver'),
    require('./resolvers/companyResolver'),
    require('./resolvers/jobResolver'),
    require('./resolvers/applicationResolver'),
    require('./resolvers/statsResolver')
  ]
});
