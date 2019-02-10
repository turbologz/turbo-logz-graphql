import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type User {
        userId: String!
        token: String
        username: String
    }
    
    type CloudFoundryLog {
        appId: String!
        log: String!
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
    }
    
    type Query {
        user(userId: String!): User
    }
    
    type Subscription {
        tailLog(appId: String!): CloudFoundryLog!
    }
`;
