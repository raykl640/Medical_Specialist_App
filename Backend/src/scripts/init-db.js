import { db } from '../config/firebase.js';

// Sample data initialization
async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');

    // Initialize Clinics
    const clinics = [
      {
        name: 'City General Hospital',
        location: 'Downtown, Nairobi',
        address: '123 Main Street, Nairobi',
        phone: '+254-700-123456',
        email: 'info@citygeneral.co.ke',
        services: ['Emergency', 'Surgery', 'Cardiology', 'Pediatrics'],
        createdAt: new Date()
      },
      {
        name: 'Westlands Medical Center',
        location: 'Westlands, Nairobi',
        address: '456 Westlands Road, Nairobi',
        phone: '+254-700-789012',
        email: 'contact@westlandsmed.co.ke',
        services: ['Dermatology', 'Orthopedics', 'Neurology'],
        createdAt: new Date()
      }
    ];

    // Add clinics
    const clinicRefs = [];
    for (const clinic of clinics) {
      const clinicRef = await db.collection('clinics').add(clinic);
      clinicRefs.push(clinicRef);
      console.log(`Added clinic: ${clinic.name}`);
    }

    // Initialize Specialists
    const specialists = [
      {
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        clinicId: clinicRefs[0].id,
        qualifications: ['MD', 'Board Certified Cardiologist'],
        experience: '15 years',
        languages: ['English', 'Swahili'],
        availability: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00' }
        ],
        consultationFee: 5000,
        createdAt: new Date()
      },
      {
        name: 'Dr. Michael Ochieng',
        specialty: 'Dermatology',
        clinicId: clinicRefs[1].id,
        qualifications: ['MD', 'Dermatology Specialist'],
        experience: '12 years',
        languages: ['English', 'Swahili'],
        availability: [
          { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
          { day: 'Thursday', startTime: '08:00', endTime: '16:00' }
        ],
        consultationFee: 4000,
        createdAt: new Date()
      }
    ];

    // Add specialists
    for (const specialist of specialists) {
      await db.collection('specialists').add(specialist);
      console.log(`Added specialist: ${specialist.name}`);
    }

    // Initialize Health Resources
    const healthResources = [
      {
        title: 'Heart Health Guide',
        category: 'Cardiology',
        content: 'Learn about maintaining a healthy heart through proper diet and exercise.',
        author: 'Medical Team',
        tags: ['heart', 'prevention', 'exercise'],
        createdAt: new Date()
      },
      {
        title: 'Skin Care Basics',
        category: 'Dermatology',
        content: 'Essential information about skin care and common conditions.',
        author: 'Dermatology Department',
        tags: ['skin', 'skincare', 'prevention'],
        createdAt: new Date()
      }
    ];

    // Add health resources
    for (const resource of healthResources) {
      await db.collection('healthResources').add(resource);
      console.log(`Added health resource: ${resource.title}`);
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });
