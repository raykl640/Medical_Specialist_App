# Medical Specialist Patient Portal - Backend

This is the backend API service for the Medical Specialist Patient Portal System. It provides RESTful APIs for managing patients, specialists, appointments, medical records, and more.

## Features

- User Authentication and Authorization
- Patient Profile Management
- Medical Specialist Management
- Appointment Scheduling and Management
- Medical Records Management
- Lab Tests Results Management
- Clinic Management
- Notifications System
- Health Resources API

## Prerequisites

- Node.js >= 18.0.0
- Firebase Admin SDK
- Firebase project with Firestore

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a service account key in Firebase Console and save it as `serviceAccountKey.json` in the root directory
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
NODE_ENV=development
```

## API Documentation

### Authentication

All API endpoints except /health require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Available Endpoints

#### Health Check

- GET /health

#### User Management

- GET /api/users/:uid/profile
- PUT /api/users/:uid/profile

#### Specialists

- GET /api/specialists
- POST /api/specialists (Admin only)

#### Appointments

- GET /api/appointments
- POST /api/appointments
- PUT /api/appointments/:id

#### Medical Records

- GET /api/medical-history/:patientId
- GET /api/lab-tests/:patientId

#### Clinics

- GET /api/clinics
- POST /api/clinics (Admin only)

#### Notifications

- GET /api/notifications
- PUT /api/notifications/:id/read

#### Health Resources

- GET /api/health-resources

## Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with hot reload
- `npm run lint`: Run ESLint
- `npm test`: Run tests
- `npm run init-db`: Initialize database with sample data

## Project Structure

```
src/
├── app.js            # Express app setup
├── index.js          # Server initialization
├── config/           # Configuration files
├── middleware/       # Custom middleware
└── services/         # Business logic
```

## Security

- All routes are protected with Firebase Authentication
- Role-based access control for admin functions
- Data access control based on user ownership
- Input validation and sanitization
- CORS configuration

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "error": "Error message"
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is licensed under the MIT License.
