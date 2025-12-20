# Backend Environment Variables Setup

This backend requires environment variables to be configured in a `.env` file.

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set the required variables (see below)

## Required Variables

### Database Configuration

#### `DB_HOST`
- **Description**: MySQL database host
- **Default**: `localhost`
- **Required**: Yes

#### `DB_USER`
- **Description**: MySQL database username
- **Default**: `root`
- **Required**: Yes

#### `DB_PASSWORD`
- **Description**: MySQL database password
- **Default**: `` (empty)
- **Required**: Yes (if your MySQL has a password)

#### `DB_NAME`
- **Description**: MySQL database name
- **Default**: `news_platform`
- **Required**: Yes

### Server Configuration

#### `PORT`
- **Description**: Port for the Express server
- **Default**: `9000`
- **Required**: No

#### `JWT_SECRET`
- **Description**: Secret key for JWT token signing
- **Default**: None (must be set)
- **Required**: Yes (change this in production!)
- **Example**: `your-super-secret-key-change-this-in-production`

#### `JWT_EXPIRES_IN`
- **Description**: JWT token expiration time
- **Default**: `7d` (7 days)
- **Required**: No

### Admin User Configuration

#### `ADMIN_EMAIL`
- **Description**: Email address for the default admin user
- **Default**: `admin@news.com`
- **Required**: No (but recommended to change)
- **Note**: This is used when running `npm run setup-db`

#### `ADMIN_PASSWORD`
- **Description**: Password for the default admin user
- **Default**: `admin123`
- **Required**: No (but **strongly recommended** to change!)
- **Note**: This is used when running `npm run setup-db`

## Example .env File

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=news_platform

# Server
PORT=9000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Admin User (used during database setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password-here
```

## Setting Up the Database

After configuring your `.env` file, run:

```bash
npm run setup-db
```

This will:
1. Create the database and tables
2. Create an admin user with the email and password from your `.env` file
3. Hash the password securely using bcrypt

## Changing Admin Credentials

To change the admin email or password:

1. Update `ADMIN_EMAIL` and/or `ADMIN_PASSWORD` in your `.env` file
2. Run one of these commands:

**Option 1: Update existing admin (recommended)**
```bash
npm run update-admin
```
This will update the existing admin user without recreating the database.

**Option 2: Re-run database setup**
```bash
npm run setup-db
```
This will update the admin user (won't recreate tables if they already exist).

**Option 3: Manual database update**
```sql
UPDATE users SET email = 'newemail@example.com', password = '<hashed_password>' WHERE role = 'admin';
```

## Security Notes

- **Never commit `.env` files to version control**
- Change `JWT_SECRET` to a strong, random string in production
- Change `ADMIN_PASSWORD` to a strong password
- Use environment-specific `.env` files (`.env.development`, `.env.production`)

