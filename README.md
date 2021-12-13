This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setup Local Dev Environment

1. Install Postgres if you don't have it.

2. Install node dependencies:

```bash
yarn install
```

3. Copy **prisma/.env.example** file and rename it to **prisma/.env**. Change **DATABASE_URL** variable for your local environment.

4. Set up your local datebase and seed initial data:

```bash
npx prisma migrate dev
```

5. Run the development server:

```bash
yarn dev
```
