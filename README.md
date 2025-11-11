# 🔐 NestJS IAM Service

An authentication & authorization microservice designed to integrate easily into any project, saving development time and offering full flexibility for customization.

## Features  
- **JWT based** - Efficient and stateless, ideal for microservice architecture — reduces database load and simplifies scaling.

- **High security standards** - Passwords hashed with Argon2, Redis-powered rate limiting, and rigorous testing ensure robust protection against brute-force and other common attacks.

- **Client-agnostic** - Works seamlessly with both web and mobile clients by handling JWTs from cookies as well as HTTP headers.

- **Database-agnostic** - Supports both relational (PostgreSQL) and non-relational (MongoDB) databases.

- **OAuth 2.0 integration** - Let the users sign up effortlessly thanks to Google provider.

- **Built-in admin routes** - Manage users, reset their passwords, assign roles, and force logout from all devices when needed.

- **Audit log** - Track every movement to detect suspicious behavior.

- **Prometheus monitoring** - Collect real-time metrics on app performance, security events, and system health to enable proactive monitoring and alerting.

- **Automated maintenance with cronjobs** - Periodic cleanup tasks ensure data integrity and optimal performance without manual intervention.



## Tech Stack  
- **Node.js**
- **NestJS**  
- **TypeScript**
- **MongoDB + Mongoose**
- **PostgreSQL + TypeORM**
- **Redis**   
- **Grafana + Loki + Prometheus**
- **Docker**  
- **Python**  
 
### .env file structure:

```
NODE_ENV=development # or production or test
DB_TYPE=pg # or mongo

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

MAIL_USER=
MAIL_PASS=

# OAuth 2.0
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

REDIS_URI=localhost # or different
REDIS_PORT=6379 # or different
```

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```