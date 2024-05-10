# Rizmic Fits Backend API

[![Node.js Version](https://img.shields.io/badge/node.js-20.13.1-brightgreen.svg)](https://nodejs.org/en/)
[![Express Version](https://img.shields.io/badge/express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/cloud/atlas)
[![Jest Testing](https://img.shields.io/badge/testing-jest%2Bsupertest-red.svg)](https://jestjs.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to the backend repository for Rizmic Fits, a comprehensive platform designed to manage wardrobe elements efficiently. This API handles user data, wardrobe items, outfit combinations, and social interactions using a robust, secure, and scalable server environment.

If you haven't already, check out the front-end code: [https://github.com/anisulh/RizmicClient](https://github.com/anisulh/RizmicClient)

## Features

- **OAuth Authentication**: Support for Google OAuth for user authentication.
- **JWT and httpOnly Cookies**: Ensures secure authentication via JWTs stored in httpOnly cookies.
- **Rate Limiting with Redis**: Prevents abuse with built-in rate limiting using Redis.
- **Cloudinary for Image Storage**: Efficiently handles image uploads and storage using Cloudinary.
- **Robust Validation with Zod**: Ensures data integrity with strong request body validation using Zod.
- **Email Integration**: Features emailing capabilities with Nodemailer and Google OAuth.
- **CRUD Operations**: Comprehensive create, read, update, and delete operations for users, clothes, outfits, and friends.
- **Mongoose & MongoDB Atlas**: Leverages Mongoose for data modeling and MongoDB Atlas for cloud database services.

## Technologies

- **Node.js** and **Express.js** for server setup
- **TypeScript** for type-safe code
- **Jest** and **Supertest** for backend testing
- **Zod** for request body validation
- **MongoDB Atlas** for database management
- **Redis** for rate limiting
- **Cloudinary** for image management
- **Nodemailer** and **Google API** for email functionalities

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- npm
- MongoDB Atlas Account
- Redis Instance
- Cloudinary Account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/anisulh/RizmicServer.git
   ```

2. **Navigate to the project directory**

   ```bash
   cd RizmicServer
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory and update it with your MongoDB URI, Redis URI, Cloudinary keys, and other configurations based on `@/src/config/config.ts`. 

5. **Run the server**

   ```bash
   npm run start
   ```
   
## Running Tests

To run tests, create an `test.env` in `@/src/config` folder and execute the following command:

```bash
npm run test-local
```

## Contributing

Contributions are what make the open-source community such a fantastic place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Best way to get in contact is via email: rizmicfits@gmail.com
