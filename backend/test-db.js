const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

console.log('Connecting to database...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Try to create a test user directly
      const testUser = new User({
        name: 'Test User',
        email: 'testdirect@example.com',
        password: 'test123',
        college: 'Test College',
        age: 25
      });
      
      console.log('Saving test user...');
      const savedUser = await testUser.save();
      console.log('User saved successfully:', savedUser);
      
      // Clean up - delete the test user
      await User.deleteOne({ email: 'testdirect@example.com' });
      console.log('Test user cleaned up');
      
    } catch (error) {
      console.error('Database operation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });