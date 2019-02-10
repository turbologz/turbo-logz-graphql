import {gql} from 'apollo-server-express';

export const typeDefs = gql`
    type User {
        userId: String!
        token: String
        username: String
    }
    
    type CloudFoundryLog {
        host: String!
        ident: String!
        message: String!
        time: Int!
        pid: String!
        tag: String!
    }
    
    type Mutation {
        signup(username: String! email: String! password: String!): User
    
        login(username: String! password: String!): User
    }
    
    type Query {
        user(userId: String!): User
    }
    
    type Subscription {
        tailLog(ident: String!): CloudFoundryLog!
    }
`;
