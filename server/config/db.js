const mongoose = require('mongoose');
// workaccasd
// 9m2jQiIaOErhbmNa

// bbadmin
// g65U9MjKo3Yi3i0L

// mongodb+srv://workaccasd:9m2jQiIaOErhbmNa@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=brainburst
const connectDB = async () => {
    try {
        /* await mongoose.connect('mongodb+srv://workaccasd:QwIvwrxxCKBJmFkt@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=brainburst', { */
        await mongoose.connect('mongodb+srv://workaccasd:QwIvwrxxCKBJmFkt@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=brainburst', {
            /* await mongoose.connect('mongodb://10.152.183.10:27017/brainburst', { */
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ Connecting error to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
