import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Mount the RabbitMQ Microservice (The Worker) [cite: 23]
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL], // CloudAMQP URL [cite: 27]
      queue: 'notification_queue',
      queueOptions: {
        durable: true, // Messages survive restarts [cite: 29]
      },
      noAck: false, // We will manually acknowledge messages [cite: 55]
    },
  });

  // 2. Start Microservices & HTTP Server together [cite: 34, 35]
  await app.startAllMicroservices();
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();