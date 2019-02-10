import * as retry from 'async-retry';
import * as isCi from 'is-ci';
import {KafkaClient, Producer} from 'kafka-node';
import {createRestAppClient, givenHttpServerConfig, Client} from '@loopback/testlab';

let {Docker} = require('node-docker-api');

export interface Container {
    stop: Function;
    start: Function;
    status: Function;
}

export function getTestClient(): Client {
    const client = createRestAppClient({restServer: {url: 'http://localhost:8000'}});

    return client;
}

export async function startKafka(): Promise<Container> {
    return await retry(async () => {
        return await startKafkaContainer();
    }, {
        retries: 10
    });
}

async function startKafkaContainer(): Promise<Container> {
    const docker = new Docker({socketPath: '/var/run/docker.sock'});

    const container = await docker.container.create({
        Image: 'spotify/kafka',
        host: '127.0.0.1',
        port: 9092,
        Env: ['ADVERTISED_HOST=127.0.0.1', 'ADVERTISED_PORT=9092'],
        HostConfig: {
            PortBindings: {
                '9092/tcp': [
                    {
                        HostPort: '9092',
                    }
                ]
            }
        }
    });

    await container.start();

    return container;
}

export async function stopContainer(container: Container) {
    if (isCi) {
        return;
    }
    container.stop();
    let dead = false;

    while (!dead) {
        const status = await container.status();
        dead = status.data.State.Status === 'exited';
    }
}

export async function connectToKafka(): Promise<KafkaClient> {
    await retry(async () => {
        const client = new KafkaClient({kafkaHost: process.env.KAFKA_HOST});

        const producer = new Producer(client);

        await new Promise((resolve, reject) => {
            producer.on('ready', () => resolve());

            producer.on('error', () => reject());
        });
        client.close();
    }, {
        retries: 10
    });

    const client = new KafkaClient({kafkaHost: process.env.KAFKA_HOST});

    return client;
}
