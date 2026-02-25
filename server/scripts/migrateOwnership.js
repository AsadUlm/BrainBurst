const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Test = require('../models/Test');
const connectDB = require('../config/db');

async function runMigration() {
    try {
        await connectDB();
        console.log('Connected to DB');

        let defaultOwner = await User.findOne({ role: 'teacher' });
        if (!defaultOwner) {
            defaultOwner = await User.findOne({ role: 'admin' });
        }

        if (!defaultOwner) {
            console.error('No teacher or admin user found to assign ownership to.');
            process.exit(1);
        }

        const ownerId = defaultOwner._id;
        console.log(`Assigning ownerId: ${ownerId} (${defaultOwner.email}, role: ${defaultOwner.role})`);

        // Update all categories without an ownerId
        const categoriesResult = await Category.updateMany(
            { ownerId: { $exists: false } },
            { $set: { ownerId } }
        );
        console.log(`Categories updated: ${categoriesResult.nModified || categoriesResult.modifiedCount || 0}`);

        // Update all tests without an ownerId
        const testsResult = await Test.updateMany(
            { ownerId: { $exists: false } },
            { $set: { ownerId } }
        );
        console.log(`Tests updated: ${testsResult.nModified || testsResult.modifiedCount || 0}`);

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
