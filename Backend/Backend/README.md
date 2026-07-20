# ETS Backend

Production-ready Fastify API for the ETS project.

## Stack

- Node.js with ES modules
- Fastify, Helmet, CORS, rate limiting, gzip compression
- MongoDB with Mongoose
- Redis-ready infrastructure for future caching
- Candidate profile API for the frontend profile builder
- Winston logging, PM2 clustering config, Docker support
- Jest unit tests; Supertest is installed for endpoint integration tests

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

Run MongoDB and Redis locally, or start the full stack:

```sh
docker compose up --build
```

## Commands

```sh
npm run dev        # start with nodemon auto-restart
npm run start      # start normally
npm run lint       # run ESLint
npm run test       # run Jest tests
npm run pm2:start  # run clustered with PM2 through npx
```

## API

- `GET /api/v1/health`
- `POST /api/v1/candidate-profiles/image`
- `POST /api/v1/candidate-profiles`
- `GET /api/v1/candidate-profiles/:id`
