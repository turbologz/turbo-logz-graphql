import 'mocha';
import "isomorphic-fetch";
import {gql} from 'apollo-server-express';
import {ApolloClient} from 'apollo-client';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';
import * as nock from 'nock';
import {expect} from 'chai';
import {userApi} from '../src/remote/endpoints';
import {setContext} from 'apollo-link-context';
import {main} from '../src';
import {GraphqlApplication} from '../src/application';

describe('graphql', () => {

    const graphqlPort = 8000;
    const graphqlWsPort = 3000;

    let app: GraphqlApplication;
    let client: any;

    beforeEach(async () => {
        app = await main({port: graphqlPort, ws: {port: graphqlWsPort}});

        const authLink = setContext((_, {headers}) => {
            return {
                headers: {
                    ...headers,
                    authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJ1c2VybmFtZSI6InRlc3RVc2VyIiwiaWF0IjoxNTQyMjIwNTg5fQ.JzdxdrGbVy7Nju5aymKXT2XWQyoVftyB9ZtBxO9UbvE`,
                }
            }
        });

        client = new ApolloClient({
            link: authLink.concat(createHttpLink({uri: `http://localhost:${graphqlPort}/graphql`})),
            cache: new InMemoryCache()
        });
    });

    afterEach(async () => {
        await app.stop();

        nock.cleanAll();
        nock.restore();
        nock.activate();
    });

    describe('user', () => {

        it('should be able to signup', async () => {
            nock(`${userApi}`)
                .post('/users')
                .reply(200, {userId: 'bla'});

            const mutation = gql`
                mutation signup($username: String! $email: String! $password: String!){
                  signup(username: $username email: $email password: $password) {
                    userId
                  }
                }
            `;

            const response = await client.mutate({
                mutation,
                variables: {username: 'test', email: 'test@test.com', password: 'test'}
            });

            expect(response.data.signup.userId).to.eql('bla');
        });

        it('should be able to login', async () => {
            nock(`${userApi}`)
                .post('/login')
                .basicAuth({user: 'testUser', pass: 'testPass'})
                .reply(200, {token: 'blaToken', userId: 'bla'});

            const mutation = gql`
                mutation login($username: String!, $password: String!){
                  login(username: $username, password: $password) {
                    userId
                    token
                  }
                }
            `;

            const response = await client.mutate({mutation, variables: {username: 'testUser', password: 'testPass'}});

            expect(response.data.login.userId).to.eql('bla');
            expect(response.data.login.token).to.eql('blaToken');
        });
    });
});
