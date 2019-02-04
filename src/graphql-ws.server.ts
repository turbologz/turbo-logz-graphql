import {Server, CoreBindings, Application} from '@loopback/core';
import {Context, inject} from '@loopback/context';
import {createServer} from 'http';
import * as jwt from 'express-jwt';
import {Logger} from 'winston';
import * as http from 'http';
import * as express from 'express';
import {SubscriptionServer} from 'subscriptions-transport-ws';
import {execute, GraphQLSchema, subscribe} from 'graphql';
import {ConsumerGroup} from 'kafka-node';

export class GraphqlWsServer extends Context implements Server {
    private _listening: boolean = false;
    private server: http.Server;
    private wsServer: SubscriptionServer;

    @inject('logger')
    public logger: Logger;

    @inject('jwt.secret')
    public jwtSecret: string;

    @inject('server.ws.port')
    public port: number;

    @inject('graphql.schema')
    public schema: GraphQLSchema;

    @inject('kafka.logs.consumer')
    public logsConsumerGroup: ConsumerGroup;

    constructor(@inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application) {
        super(app);
    }

    get listening() {
        return this._listening;
    }

    async start(): Promise<void> {
        const expressServer = express();
        const wsServer = createServer(expressServer);

        await new Promise((resolve) => {
            this.server = wsServer.listen(9000, () => {
                this.wsServer = new SubscriptionServer({
                    execute,
                    subscribe,
                    schema: this.schema
                }, {
                    host: '0.0.0.0',
                    port: this.port,
                    server: wsServer,
                    path: '/',
                });

                this.logger.info(`WS Server listening on port ${this.port}`);

                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        await this.wsServer.close();
        await this.server.close();

        this.logsConsumerGroup.client.close();

        await new Promise((resolve) => {
            this.logsConsumerGroup.close(() => resolve());
        });
    }
}
