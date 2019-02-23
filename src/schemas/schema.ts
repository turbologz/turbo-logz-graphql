import {signup, login} from '../remote/user';
import {withFilter, PubSub} from 'graphql-subscriptions';
import {ConsumerGroup} from "kafka-node";
import {getApps, getOrgs, getSpaces} from '../remote/cloud-foundry';

export const pubsub = new PubSub();

export function startListeningToKafka(consumerGroup: ConsumerGroup) {

    consumerGroup.on('message', async (message: any) => {

        console.log('Got message');
        console.log(message);

        const log = JSON.parse(message.value);

        console.log('Parsed', log);

        await pubsub.publish('tail-log', {
            tailLog: {
                host: log.host,
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
    Query: {
        // Cloud Foundry
        cfOrgs: (_: any, args: any, ctx: any) => {
            return ctx.authenticated ? getOrgs() : null;
        },

        cfSpaces: (_: any, args: any, ctx: any) => {
            return ctx.authenticated ? getSpaces(args.orgId) : null;
        },

        cfApps: (_: any, args: any, ctx: any) => {
            return ctx.authenticated ? getApps(args.spaceId) : null;
        },
    },

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
