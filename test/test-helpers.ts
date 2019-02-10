import {connect, Connection} from 'amqplib';
import * as retry from 'async-retry';
import * as isCi from 'is-ci';
import {KafkaClient, Producer} from 'kafka-node';

let {Docker} = require('node-docker-api');

export interface Container {
    stop: Function;
    start: Function;
    status: Function;
}

const {AMQP_URL, AMQP_USER, AMQP_PWD}: any = process.env;

export async function startRabbitMq(): Promise<Container> {
    if (!isCi) {
        return await retry(async () => {
            return await startMqContainer();
        }, {
            retries: 10
        });
    }

    return {
        start: () => {
        },
        stop: () => {
        },
        status: () => {
        },
    };
}

export async function startKafka(): Promise<Container> {
    if (!isCi) {
        return await retry(async () => {
            return await startKafkaContainer();
        }, {
            retries: 10
        });
    }

    return {
        start: () => {
        },
        stop: () => {
        },
        status: () => {
        },
    };
}

async function startMqContainer(): Promise<Container> {
    const docker = new Docker({socketPath: '/var/run/docker.sock'});

    const container = await docker.container.create({
        Image: 'rabbitmq',
        host: '127.0.0.1',
        port: 5672,
        HostConfig: {
            PortBindings: {
                '5672/tcp': [
                    {
                        HostPort: '5672',
                    },
                ],
            },
        },
    });

    await container.start();

    return container;
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

export async function connectToMq(): Promise<Connection> {
    await retry(async () => {
        const tempConn = await connect({hostname: AMQP_URL, username: AMQP_USER, password: AMQP_PWD});

        await tempConn.close();
    }, {
        retries: 10,
    });

    return await connect({hostname: AMQP_URL, username: AMQP_USER, password: AMQP_PWD});
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
