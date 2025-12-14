# Trello Lite API

A RESTful API for a Trello-like project management application built with NodeJS.

## Features

- **User Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (Admin, Project Admin, Member)
  - Token refresh mechanism

- **Project Management**

  - Create and manage projects
  - Project membership and permissions
  - Project status tracking

- **Task Management**

  - Create and manage tasks within projects
  - Task status updates
  - Task assignment to team members

- **Team Collaboration**
  - Add/remove team members
  - Assign admin privileges
  - Track member activity

## Tech Stack

- **Backend Framework**: NestJS
- **Authentication**: JWT (tymon/jwt-auth)
- **Database**: MySQL (configurable)
- **API Documentation**: Postman

## Prerequisites

- NodeJS 22.10.0 or higher
- MySQL 5.7+
- NPM

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/API-Trello-Lite-NestJS.git
   cd API-Trello-Lite-NestJS
   ```

2. **Install NPM dependencies**

   ```bash
   npm install
   ```

3. **Install NPM dependencies (if needed)**

   ```bash
   npm install
   ```

4. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

5. **Configure Database**
   Update your `.env` file with your database credentials:

   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=trello_lite
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   ```

6. **Run Migrations**

   ```bash
   npx typeorm-ts-node-commonjs migration:run -d src/table-source.ts
   npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts

   ```

7. **Revert Migration**

   ```bash
   npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts
   ```

## API Documentation

The API documentation is available at `https://ez5555.postman.co/workspace/Personal~32cdb27e-3f1d-4e16-9908-1d289dcc7313/collection/26937832-96a3b737-ea51-4e69-82f2-670051acab58?action=share&creator=26937832` after setting up the application.

### Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer your_jwt_token_here
```
