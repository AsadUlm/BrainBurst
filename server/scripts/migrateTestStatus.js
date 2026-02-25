const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Test = require('../models/Test');
const connectDB = require('../config/db');

async function runMigration() {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Update tests where isVisible is true to 'public'
        const publicResult = await Test.updateMany(
            { isVisible: true },
            { $set: { status: 'public' }, $unset: { isVisible: "" } }
        );
        console.log(`Updated visible tests to public: ${publicResult.nModified || publicResult.modifiedCount || 0}`);

        // Update tests where isVisible is false to 'private'
        const privateResult = await Test.updateMany(
            { isVisible: false },
            { $set: { status: 'private' }, $unset: { isVisible: "" } }
        );
        console.log(`Updated hidden tests to private: ${privateResult.nModified || privateResult.modifiedCount || 0}`);

        // Handle any stragglers without status or isVisible
        const stragglerResult = await Test.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'class_only' } }
        );
        console.log(`Updated remaining tests to class_only: ${stragglerResult.nModified || stragglerResult.modifiedCount || 0}`);

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
