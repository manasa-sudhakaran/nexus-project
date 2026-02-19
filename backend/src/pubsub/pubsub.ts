import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis'

const redisOptions = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD||undefined,
};

export const pubsub = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions)
});