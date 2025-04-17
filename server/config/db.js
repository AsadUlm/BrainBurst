const mongoose = require('mongoose');
// workaccasd
// 9m2jQiIaOErhbmNa
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://workaccasd:9m2jQiIaOErhbmNa@brainburst.ytksvbv.mongodb.net/?retryWrites=true&w=majority&appName=brainburst', {
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
