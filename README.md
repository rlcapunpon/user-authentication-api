# User Authentication API

This is a standalone User Authentication and Authorization Service built with Node.js, Express, and Prisma. It provides a robust API for user management, authentication (email/password with JWT), role-based access control (RBAC), and basic OpenID Connect (OIDC) capabilities.

## Features

- User Registration, Login, Logout
- JWT-based Authentication (Access & Refresh Tokens)
- Token Refresh and Revocation
- Role-Based Access Control (RBAC) with flexible permissions
- User Profile Management (Self-service and Admin)
- OpenID Connect (OIDC) Basic Discovery and JWKS Endpoint
- OpenAPI (Swagger UI) Documentation
- PostgreSQL Database with Prisma ORM
- Comprehensive Test Suite

## Technologies Used

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: bcrypt, jsonwebtoken
- **Validation**: Zod
- **Environment Management**: dotenv
- **API Documentation**: swagger-jsdoc, swagger-ui-express
- **Testing**: Jest, Supertest
- **Linting/Formatting**: ESLint, Prettier

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm (Node Package Manager)
- PostgreSQL (version 12 or higher recommended)

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/user-authentication-api.git
cd user-authentication-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the project by copying `.env.example` and filling in the values. This file will contain sensitive information and configuration.

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configurations. A typical `.env` file might look like this:

```
DATABASE_URL="postgresql://postgres:admin@localhost:5432/wind_auth?schema=public"
JWT_SECRET="your-super-secret-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=4000
CORS_ORIGINS="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
SUPER_ADMIN_EMAIL="superadmin@example.com"
SUPER_ADMIN_PASSWORD="superadminpassword"
```

**Important**: Ensure your `DATABASE_URL` matches your PostgreSQL setup (username, password, host, port, and database name).

### 4. Database Setup

Run Prisma migrations to create the necessary tables in your PostgreSQL database and then seed the database with initial roles (SUPERADMIN, ADMIN, APPROVER, STAFF, CLIENT) and permissions.

```bash
npx prisma migrate dev --name init
npm run seed
```

### 5. Running with Docker

You can also run the application using Docker and Docker Compose. This is the recommended way for consistent environments.

#### Prerequisites for Docker

- Docker Desktop (or Docker Engine) installed and running.

#### Build and Run Containers

```bash
docker-compose up --build -d
```

This command will:
- Build the `app` service image using the `Dockerfile`.
- Start the `db` (PostgreSQL) and `app` services.
- Run them in detached mode (`-d`).

#### Run Migrations and Seed Database (within Docker)

After the containers are up, you need to run Prisma migrations and seed the database inside the `app` container.

```bash
docker-compose exec app npx prisma migrate dev --name init --skip-generate
docker-compose exec app npm run seed
```

**Note**: The `--skip-generate` flag is used because the Prisma client is already generated during the `docker build` process.

#### Access the Application

The API will be available at `http://localhost:4000`.

To stop the containers:

```bash
docker-compose down
```

### 6. Running the Application

#### Development Mode (with hot-reloading)

```bash
npm run dev
```

#### Production Mode

First, build the project:

```bash
npm run build
```

Then, start the application:

```bash
npm start
```

The API will be available at `http://localhost:4000` (or the `PORT` specified in your `.env` file).

### 7. Running Tests

To run the test suite:

```bash
npm test
```

### 8. Linting and Formatting

To check for linting errors:

```bash
npm run lint
```

To automatically format your code:

```bash
npm run format
```

### 9. Accessing API Documentation (Swagger UI)

Once the application is running, you can access the interactive API documentation at:

`http://localhost:4000/docs` (or `http://localhost:<YOUR_PORT>/docs`)
