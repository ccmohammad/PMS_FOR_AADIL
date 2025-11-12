const { hash } = require('bcryptjs');
const mongoose = require('mongoose');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

// Default admin credentials for initial setup
const DEFAULT_ADMIN = {
  name: 'Admin User',
  email: 'admin@pharmacy.com',
  password: 'Admin123!',
  role: 'admin'
};

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
    },
  },
  { timestamps: true }
);

// Create the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedDatabase() {
  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI as string;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  console.log('Seeding database...');
  
  // Check if admin user already exists
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
  
  if (existingAdmin) {
    console.log('Admin user already exists.');
  } else {
    // Create admin user
    const hashedPassword = await hash(DEFAULT_ADMIN.password, 12);
    
    await User.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      role: DEFAULT_ADMIN.role,
    });
    
    console.log('Admin user created successfully.');
    console.log('Default admin credentials:');
    console.log(`Email: ${DEFAULT_ADMIN.email}`);
    console.log(`Password: ${DEFAULT_ADMIN.password}`);
    console.log('Please change these credentials after your first login!');
  }
  
  console.log('Seeding complete!');
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// Run the seed function
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('An error occurred while seeding the database:', error);
    process.exit(1);
  }); 