import { Resolver, Mutation, Args, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// import { PubSub } from 'graphql-redis-subscriptions';
import { pubsub } from './pubsub/pubsub';

// const pubSub = new PubSub();

@Resolver()
export class ApiResolver {
  constructor(
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy, // Inject RabbitMQ Client
  ) {}

  @Mutation(() => Boolean)
  async sendNotification(
    @Args('recipient') recipient: string,
    @Args('channel') channel: string,
    @Args('payload') payload: string
  ) {
    const data = { recipient, channel, payload: JSON.parse(payload) };
    
    // Send to Queue (Fire and Forget) [cite: 136]
    this.client.emit('send_notification', data);
    
    return true; // Return immediately to UI (Non-blocking)
  }

  // Real-time Subscription for Dashboard [cite: 110]
  @Subscription(() => Number, {
    resolve: (payload) => payload.notificationProcessed,
  })
  notificationProcessed() {
    return pubsub.asyncIterator('notificationProcessed');
  }
}