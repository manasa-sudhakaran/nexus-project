# Project Nexus – Event-Driven Notification Engine

> **Status: Under Active Development**
>
> This project is currently in progress. Core architecture and
> features are being added iteratively. APIs and deployment steps may change.

---

## Overview

Project Nexus is a scalable, event-driven notification engine designed using
Enterprise Integration Patterns while running entirely on cloud infrastructure.

It demonstrates how to achieve:

- Microservice architecture principles
- Reactive processing
- Real-time UI updates

**without microservice hosting cost**
using the **Modular Monolith pattern**.

---

## Architecture Philosophy

To achieve *“Microservices logic without microservices cost”*:

- Logical separation → NestJS modules
- Physical deployment → Single container

This allows:

- Independent scaling in the future
- Production-grade design

---

## High-Level Architecture

### Flow

1. External client sends GraphQL mutation
2. API Gateway publishes event → RabbitMQ
3. Background worker consumes & batches using RxJS
4. Bulk insert into PostgreSQL
5. Redis Pub/Sub pushes real-time update
6. Next.js dashboard updates via GraphQL subscription

---

## System Components

### Backend (NestJS – Modular Monolith)

#### API Module
- GraphQL endpoint
- Request validation
- Publishes events to RabbitMQ

#### Worker Module
- Consumes events via `@EventPattern`
- RxJS smart batching
- Bulk DB insert using Prisma
- Publishes real-time updates via Redis

---

### Frontend (Next.js 14)

- Notification log dashboard
- GraphQL query for initial data
- GraphQL subscription for live updates

---

## Infrastructure Stack

| Component  | Provider |
|------------|----------|
Compute      | Render (Web Service)  
Frontend     | Vercel  
Database     | Neon PostgreSQL  
Queue        | CloudAMQP (RabbitMQ)  
Cache / WS   | Upstash Redis  

---

## Core Tech Stack

### Backend
- NestJS
- GraphQL
- RabbitMQ
- RxJS
- Prisma
- PostgreSQL

### Frontend
- Next.js 14 (App Router)
- GraphQL Client
- WebSocket subscriptions

---

## Key Features (In Progress / Planned)

### In Progress
- Hybrid NestJS application (API + Worker in one process)
- RabbitMQ integration
- Event consumer
- RxJS batching pipeline
- Bulk insert with Prisma
- Dashboard UI enhancements

### Planned
- Notification log schema
- GraphQL subscriptions
- Deployment automation
- Auth & multi-channel notifications
- Retry & failure handling
- Rate limiting
- Observability (logs & metrics)
- Horizontal scaling (split into services)

---

## Database Schema

```prisma
model NotificationLog {
  id         String   @id @default(uuid())
  recipient  String
  channel    String
  status     String
  payload    Json
  createdAt  DateTime @default(now())

  @@index([status])
}
