import {Application, ApplicationConfig} from '@loopback/core';
import {createLogger, transports} from 'winston';
import {GraphqlServer} from './graphql.server';
import {makeExecutableSchema} from 'graphql-tools';
import {resolvers} from './schemas/schema';
import {typeDefs} from './types/types';
import {GraphqlWsServer} from './graphql-ws.server';
import {ConsumerGroup} from 'kafka-node';

const {JWT_SECRET, KAFKA_HOST}: any = process.env;

export class GraphqlApplication extends Application {

    constructor(options: ApplicationConfig = {}) {
        super(options);

        const logger = createLogger({
            transports: [
                new transports.Console(),
            ],
        });

        const tasksLogConsumer = new ConsumerGroup({
            kafkaHost: KAFKA_HOST,
            groupId: 'graphql-listener',
            fromOffset: 'latest'
        }, ['log-analysis']);

        this.server(GraphqlServer);
        this.server(GraphqlWsServer);

        // Logger
        this.bind('logger').to(logger);

        // Jwt
        this.bind('jwt.secret').to(JWT_SECRET);

        // Server Options
        this.bind('server.port').to(this.options.port);
        this.bind('server.ws.port').to(this.options.ws.port);

        // Graphql
        this.bind('graphql.schema').to(makeExecutableSchema({typeDefs, resolvers}));

        // kafka
        this.bind('kafka.logs.consumer').to(tasksLogConsumer);

        this.options.port = this.options.port || 3000;
    }

}
