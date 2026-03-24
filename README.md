# 🧑‍💼 Client Hub

A full-stack **MERN** application for managing clients, projects, and communications — all in one place.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Client Hub is a CRM-style web application that helps freelancers and small teams manage their client relationships, track project progress, log communications, and generate invoices — all from a single dashboard.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based sign up, login, and protected routes
- 👥 **Client Management** — Add, edit, and archive clients with contact details
- 📁 **Project Tracking** — Create projects linked to clients with status and deadlines
- 💬 **Communication Logs** — Record calls, emails, and meetings per client
- 🧾 **Invoicing** — Generate and track invoices with payment status
- 📊 **Dashboard** — At-a-glance stats and activity feed
- 🔔 **Notifications** — In-app alerts for upcoming deadlines and overdue invoices

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, React Router, Axios, Tailwind CSS |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB, Mongoose                   |
| Auth       | JSON Web Tokens (JWT), bcrypt       |
| Dev Tools  | Nodemon, Concurrently, dotenv       |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/client-hub.git
   cd client-hub
   ```

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables** (see [Environment Variables](#environment-variables))

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/clienthub

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

> ⚠️ Never commit `.env` to version control. A `.env.example` file is provided as a template.

---

## 📂 Project Structure

```
client-hub/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level page components
│       ├── context/         # React Context (auth, notifications)
│       ├── hooks/           # Custom React hooks
│       ├── services/        # Axios API service functions
│       └── utils/           # Helpers and constants
│
├── server/                  # Express backend
│   ├── config/              # DB connection, env config
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth, error handling
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express route definitions
│   └── utils/               # Server-side helpers
│
├── .env.example
├── .gitignore
├── package.json             # Root package (scripts for both)
└── README.md
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | `/api/auth/register`  | Register a new user |
| POST   | `/api/auth/login`     | Login and get token |
| GET    | `/api/auth/me`        | Get current user    |

### Clients
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/api/clients`        | Get all clients      |
| POST   | `/api/clients`        | Create a new client  |
| GET    | `/api/clients/:id`    | Get a single client  |
| PUT    | `/api/clients/:id`    | Update client        |
| DELETE | `/api/clients/:id`    | Delete client        |

### Projects
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | `/api/projects`        | Get all projects      |
| POST   | `/api/projects`        | Create a project      |
| GET    | `/api/projects/:id`    | Get a single project  |
| PUT    | `/api/projects/:id`    | Update project        |
| DELETE | `/api/projects/:id`    | Delete project        |

### Invoices
| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | `/api/invoices`        | Get all invoices      |
| POST   | `/api/invoices`        | Create an invoice     |
| PATCH  | `/api/invoices/:id`    | Update invoice status |

> All protected routes require a Bearer token in the `Authorization` header.

---

## 📜 Scripts

| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Run client and server concurrently       |
| `npm run server`  | Run Express server only (with nodemon)   |
| `npm run client`  | Run React frontend only                  |
| `npm run build`   | Build the React app for production       |
| `npm start`       | Start server in production mode          |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please make sure your code follows the existing style and includes relevant tests where applicable.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with ❤️ using the MERN stack
