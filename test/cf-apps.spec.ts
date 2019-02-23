import 'mocha';
import "isomorphic-fetch";
import { main } from '../src';
import { GraphqlApplication } from '../src/application';
import * as nock from 'nock';
import { setContext } from 'apollo-link-context';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { applicationsApi } from '../src/remote/endpoints';
import { expect } from 'chai';
import { gql } from 'apollo-server-express';

describe('CF Apps', () => {

    const graphqlPort = 8000;
    const graphqlWsPort = 3000;
    let client: any;

    let app: GraphqlApplication;

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

    it('should get a list of cloud apps in a space', async () => {
        nock(`${applicationsApi}`)
            .filteringPath(() => '/apps')
            .get(`/apps`)
            .reply(200, [
                {id: 'id1', spaceId: 'space1', appId: 'app1', name: 'space1'},
                {id: 'id2', spaceId: 'space1', appId: 'app2', name: 'space2'}
            ]);

        const query = gql`
                query cfApps($spaceId: String!) {
                  cfApps(spaceId: $spaceId) {
                    id
                    spaceId
                    appId
                    name
                  }
                }
            `;

        const response = await client.query({query, variables: {spaceId: 'space1'}});

        expect(response.data.cfApps).to.eql([
            {__typename: 'CloudFoundryApp', id: 'id1', spaceId: 'space1', appId: 'app1', name: 'space1'},
            {__typename: 'CloudFoundryApp', id: 'id2', spaceId: 'space1', appId: 'app2', name: 'space2'}
        ]);
    });
});
