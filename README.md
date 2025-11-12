# Pharmacy Management System

A comprehensive pharmacy management system built with Next.js, MongoDB, and Mongoose. This system helps pharmacies manage their inventory, sales, and reporting.

## Features

- **Authentication** - Secure login for admin and staff users
- **Product Management** - Add, edit, and delete pharmacy products
- **Inventory Management** - Track stock levels, expiry dates, and batch numbers
- **Sales Processing** - Process sales with prescription tracking
- **User Management** - Admin can manage staff accounts
- **Reports & Analytics** - View sales and inventory statistics

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pharmacy-next
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/pharmacy-management
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production
   
   # Admin user credentials for initial setup
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=Admin123!
   ADMIN_NAME=Admin User
   ```

4. Run the database seed script to create the admin user:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

7. Login with the admin credentials:
   - Email: admin@example.com
   - Password: Admin123!

## Production Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Ensure you have a secure MONGODB_URI and NEXTAUTH_SECRET in your environment variables.

## License

[MIT](LICENSE)
