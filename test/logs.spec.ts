import 'isomorphic-fetch';
import {expect} from '@loopback/testlab';
import {gql} from 'apollo-server-express';
import * as ws from 'ws';
import {split} from 'apollo-link';
import {SubscriptionClient} from 'subscriptions-transport-ws';
import ApolloClient from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {WebSocketLink} from 'apollo-link-ws';
import {HttpLink} from 'apollo-link-http';
import {getMainDefinition} from 'apollo-utilities';
import {GraphqlApplication} from '../src/application';
import {main} from '../src';
import {connectToKafka, Container, startKafka, stopContainer} from './test-helpers';
import {HighLevelProducer, KafkaClient, Producer} from 'kafka-node';

describe('Logs', () => {

    const log = {
        appId: 'abc123',
        log: '\u001b[34mℹ\u001b[39m \u001b[90m｢wdm｣\u001b[39m: Compiled successfully.\n'
    };

    const graphqlPort = 8000;
    const graphqlWsPort = 3000;

    let app: GraphqlApplication;
    let client: any;
    let wsClient: SubscriptionClient;
    let kafkaContainer: Container;
    let kafkaClient: KafkaClient;
    let producer: Producer;

    beforeEach(async () => {
        kafkaContainer = await startKafka();
        kafkaClient = await connectToKafka();
        producer = new HighLevelProducer(kafkaClient);

        await new Promise((resolve) => {
            producer.on('ready', () => {
                producer.send([{topic: 'log-analysis', messages: JSON.stringify(log)}], () => {
                    resolve();
                });
            });
        });

        wsClient = new SubscriptionClient(`ws://localhost:${graphqlWsPort}/`, {
            reconnect: true,
        }, ws);

        const wsLink = new WebSocketLink(wsClient);

        const httpLink = new HttpLink({
            uri: `http://localhost:${graphqlPort}/graphql`
        });

        const link = split(
            ({query}) => {
                const res = getMainDefinition(query);
                return res.kind === 'OperationDefinition' && res.operation === 'subscription';
            },
            wsLink,
            httpLink,
        );

        client = new ApolloClient({
            link,
            cache: new InMemoryCache()
        });

        app = await main({port: graphqlPort, ws: {port: graphqlWsPort}});
    });

    afterEach(async () => {
        await app.stop();
        wsClient.close();
        kafkaClient.close();
        producer.close();
        await stopContainer(kafkaContainer);
    });

    describe('tail logs', () => {

        it('should send correct logs', (done) => {
            const query = gql`
                subscription onTailLog($appId: String!) {
                  tailLog(appId: $appId) {
                    appId
                    log
                  }
                }
            `;

            client.subscribe({query, variables: {appId: 'abc123'}})
                .subscribe({
                    next(data: any) {
                        expect(data.data.tailLog).to.eql({
                            __typename: 'CloudFoundryLog',
                            appId: 'abc123',
                            log: '\u001b[34mℹ\u001b[39m \u001b[90m｢wdm｣\u001b[39m: Compiled successfully.\n'
                        });
                        done();
                    }
                });

            setTimeout(() => {
                console.log('Sending test message');
                producer.send([{topic: 'log-analysis', messages: JSON.stringify(log)}], () => {
                });
            }, 5000);
        });
    });
});
