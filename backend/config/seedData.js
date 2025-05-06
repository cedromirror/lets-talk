const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// Import models - handle case where models might not exist yet
let Post, Reel, Story;
try {
  Post = require('../models/Post');
  Reel = require('../models/Reel');
  Story = require('../models/Story');
} catch (error) {
  console.log('Some models not available, will only seed users');
}

// Function to seed default data
const seedDefaultData = async (options = {}) => {
  try {
    console.log('Starting database seed process...');

    // Check if we're using a mock database
    if (mongoose.connection.host === 'mock-database') {
      console.log('Using mock database - skipping seed process');
      return;
    }

    // Create default users
    await seedUsers();

    // Only seed content if explicitly requested or in development environment
    const shouldSeedContent = options.seedContent || process.env.NODE_ENV === 'development';

    if (shouldSeedContent) {
      // Create sample content if models are available
      if (Post) await seedPosts();
      if (Reel) await seedReels();
      if (Story) await seedStories();
      console.log('Sample content seeded successfully');
    } else {
      console.log('Skipping sample content seeding');
    }

    console.log('Seed data process completed successfully');
  } catch (error) {
    console.error('Error seeding default data:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    console.log('Checking for default users...');

    // Default users to create
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: 'admin',
        bio: 'System administrator',
        isVerified: true
      },
      {
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Test User',
        bio: 'Regular user account for testing',
        isVerified: true
      },
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        fullName: 'John Doe',
        bio: 'Photography enthusiast',
        isVerified: true
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: 'password123',
        fullName: 'Jane Doe',
        bio: 'Travel blogger',
        isVerified: true
      }
    ];

    // Check and create each user
    for (const userData of defaultUsers) {
      const userExists = await User.findOne({ email: userData.email });

      if (!userExists) {
        console.log(`Creating user: ${userData.username}`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword
        });

        await user.save();
        console.log(`User ${userData.username} created successfully`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }

    // Set up following relationships
    await setupFollowingRelationships();

    console.log('User seeding completed');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

// Set up following relationships between users
const setupFollowingRelationships = async () => {
  try {
    console.log('Setting up following relationships...');

    // Get users
    const admin = await User.findOne({ username: 'admin' });
    const testUser = await User.findOne({ username: 'testuser' });
    const johnDoe = await User.findOne({ username: 'johndoe' });
    const janeDoe = await User.findOne({ username: 'janedoe' });

    if (!admin || !testUser || !johnDoe || !janeDoe) {
      console.log('Not all users exist, skipping relationship setup');
      return;
    }

    // Admin follows everyone
    if (!admin.following.includes(testUser._id)) {
      admin.following.push(testUser._id);
      testUser.followers.push(admin._id);
    }

    if (!admin.following.includes(johnDoe._id)) {
      admin.following.push(johnDoe._id);
      johnDoe.followers.push(admin._id);
    }

    if (!admin.following.includes(janeDoe._id)) {
      admin.following.push(janeDoe._id);
      janeDoe.followers.push(admin._id);
    }

    // TestUser follows John and Jane
    if (!testUser.following.includes(johnDoe._id)) {
      testUser.following.push(johnDoe._id);
      johnDoe.followers.push(testUser._id);
    }

    if (!testUser.following.includes(janeDoe._id)) {
      testUser.following.push(janeDoe._id);
      janeDoe.followers.push(testUser._id);
    }

    // John and Jane follow each other
    if (!johnDoe.following.includes(janeDoe._id)) {
      johnDoe.following.push(janeDoe._id);
      janeDoe.followers.push(johnDoe._id);
    }

    if (!janeDoe.following.includes(johnDoe._id)) {
      janeDoe.following.push(johnDoe._id);
      johnDoe.followers.push(janeDoe._id);
    }

    // Save all users
    await admin.save();
    await testUser.save();
    await johnDoe.save();
    await janeDoe.save();

    console.log('Following relationships set up successfully');
  } catch (error) {
    console.error('Error setting up following relationships:', error);
  }
};

// Seed posts
const seedPosts = async () => {
  try {
    console.log('Checking for sample posts...');

    // Check if we already have posts
    const postCount = await Post.countDocuments();

    if (postCount > 0) {
      console.log(`${postCount} posts already exist, skipping post creation`);
      return;
    }

    // Get users to assign posts to
    const users = await User.find({});

    if (users.length === 0) {
      console.log('No users found, skipping post creation');
      return;
    }

    // Sample posts
    const samplePosts = [
      {
        caption: 'Beautiful sunset at the beach',
        image: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567890/sample_post_1.jpg',
        location: 'Malibu Beach',
        hashtags: ['sunset', 'beach', 'nature']
      },
      {
        caption: 'Delicious breakfast to start the day',
        image: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567891/sample_post_2.jpg',
        location: 'Home',
        hashtags: ['food', 'breakfast', 'healthy']
      },
      {
        caption: 'Hiking in the mountains',
        image: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567892/sample_post_3.jpg',
        location: 'Rocky Mountains',
        hashtags: ['hiking', 'mountains', 'adventure']
      },
      {
        caption: 'City lights at night',
        image: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567893/sample_post_4.jpg',
        location: 'New York City',
        hashtags: ['city', 'night', 'lights']
      }
    ];

    // Create posts and assign to random users
    for (const postData of samplePosts) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const post = new Post({
        ...postData,
        user: randomUser._id
      });

      await post.save();
      console.log(`Created post: ${postData.caption}`);
    }

    console.log('Sample posts created successfully');
  } catch (error) {
    console.error('Error seeding posts:', error);
  }
};

// Seed reels
const seedReels = async () => {
  try {
    console.log('Checking for sample reels...');

    // Check if we already have reels
    const reelCount = await Reel.countDocuments();

    if (reelCount > 0) {
      console.log(`${reelCount} reels already exist, skipping reel creation`);
      return;
    }

    // Get users to assign reels to
    const users = await User.find({});

    if (users.length === 0) {
      console.log('No users found, skipping reel creation');
      return;
    }

    // Sample reels
    const sampleReels = [
      {
        caption: 'Dance challenge',
        video: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624567894/sample_reel_1.mp4',
        audio: {
          name: 'Original Audio',
          original: true
        },
        duration: 15,
        hashtags: ['dance', 'challenge', 'fun']
      },
      {
        caption: 'Cooking tutorial',
        video: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624567895/sample_reel_2.mp4',
        audio: {
          name: 'Cooking Show Theme',
          original: false,
          artist: 'Various Artists'
        },
        duration: 30,
        hashtags: ['cooking', 'tutorial', 'food']
      },
      {
        caption: 'Travel moments',
        video: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624567896/sample_reel_3.mp4',
        audio: {
          name: 'Travel Vibes',
          original: false,
          artist: 'Travel Music'
        },
        duration: 20,
        hashtags: ['travel', 'adventure', 'memories']
      }
    ];

    // Create reels and assign to random users
    for (const reelData of sampleReels) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const reel = new Reel({
        ...reelData,
        user: randomUser._id
      });

      await reel.save();
      console.log(`Created reel: ${reelData.caption}`);
    }

    console.log('Sample reels created successfully');
  } catch (error) {
    console.error('Error seeding reels:', error);
  }
};

// Seed stories
const seedStories = async () => {
  try {
    console.log('Checking for sample stories...');

    // Check if we already have stories
    const storyCount = await Story.countDocuments();

    if (storyCount > 0) {
      console.log(`${storyCount} stories already exist, skipping story creation`);
      return;
    }

    // Get users to assign stories to
    const users = await User.find({});

    if (users.length === 0) {
      console.log('No users found, skipping story creation');
      return;
    }

    // Sample stories
    const sampleStories = [
      {
        media: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567897/sample_story_1.jpg',
        type: 'image',
        caption: 'Morning coffee',
        location: 'Coffee Shop',
        duration: 5
      },
      {
        media: 'https://res.cloudinary.com/droja6ntk/image/upload/v1624567898/sample_story_2.jpg',
        type: 'image',
        caption: 'Office view',
        location: 'Downtown',
        duration: 5
      },
      {
        media: 'https://res.cloudinary.com/droja6ntk/video/upload/v1624567899/sample_story_3.mp4',
        type: 'video',
        caption: 'Live concert',
        location: 'Music Hall',
        duration: 15
      }
    ];

    // Create stories and assign to random users
    for (const storyData of sampleStories) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Stories expire after 24 hours, so set expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = new Story({
        ...storyData,
        user: randomUser._id,
        expiresAt
      });

      await story.save();
      console.log(`Created story: ${storyData.caption}`);
    }

    console.log('Sample stories created successfully');
  } catch (error) {
    console.error('Error seeding stories:', error);
  }
};

module.exports = seedDefaultData;
