import {signup, login} from '../remote/user';
import {withFilter, PubSub} from 'graphql-subscriptions';
import {ConsumerGroup} from "kafka-node";

export const pubsub = new PubSub();

export function startListeningToKafka(consumerGroup: ConsumerGroup) {

    consumerGroup.on('message', async (message: any) => {

        console.log('Got message');
        console.log(message);

        const log = JSON.parse(message.value);

        console.log('Parsed', log);

        await pubsub.publish('tail-log', {
            tailLog: {
                ident: log.ident,
                message: log.message,
                time: log.time,
                pid: log.pid,
                tag: log.tag
            }
        });
    });
}

export const resolvers = {

    Mutation: {
        // Users
        signup: (_: any, user: any) => signup(user.username, user.email, user.password),

        login: (_: any, user: any) => login(user.username, user.password),
    },

    Subscription: {
        tailLog: {
            subscribe: withFilter(() => {
                return pubsub.asyncIterator('tail-log');
            }, (payload, variables) => {
                return payload.tailLog.ident === variables.ident;
            }),
        }
    },

};
