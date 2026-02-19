import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { bufferTime, concatMap } from 'rxjs/operators';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from './prisma.service';
// import { PubSub } from 'graphql-redis-subscriptions'; // For Real-time UI updates
import { pubsub } from './pubsub/pubsub';

// const pubSub = new PubSub(); // In prod, connect this to Redis

@Injectable()
export class WorkerService implements OnModuleInit {
  // The RxJS Stream
  private jobSubject = new Subject<any>();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.initializeStream(); // Start the pipeline [cite: 50]
  }

  // RabbitMQ Consumer [cite: 52]
  @EventPattern('send_notification')
  async handleNotification(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processNotification(data);
      channel.ack(originalMsg);
    } catch (err) {
      console.log('Processign failed', err);
      channel.nack(originalMsg,false, true)
    }
    // 1. Acknowledge immediately (Manual ACK) [cite: 55, 58]
    // channel.ack(originalMsg);

    // 2. Push to internal buffer [cite: 60]
    this.jobSubject.next(data);
  }
  processNotification(data: any) {
    throw new Error('Method not implemented.');
  }

  // The "Smart Batching" Logic [cite: 62]
  private initializeStream() {
    this.jobSubject.pipe(
      // Wait 1000ms OR until 50 items collect 
      bufferTime(1000, undefined, 50), 
      
      // Process batches sequentially [cite: 67]
      concatMap(async (batch) => {
        if (batch.length === 0) return;
        
        console.log(`🚀 Processing batch of ${batch.length} notifications...`);
        
        // Bulk Insert to DB (High Performance) [cite: 71]
        await this.prisma.notificationLog.createMany({
          data: batch.map(item => ({
            recipient: item.recipient,
            channel: item.channel,
            status: 'SENT', // Mark as processed [cite: 147]
            payload: item.payload,
          }))
        });

        // Trigger Real-time Update for UI [cite: 148]
        pubsub.publish('notificationProcessed', { notificationProcessed: batch.length });
      })
    ).subscribe();
  }
}