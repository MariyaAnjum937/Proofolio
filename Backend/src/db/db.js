const mongoose = require('mongoose');
const MentoringAssignment = require('../models/mentoringAssignment.models');
const Notification = require('../models/notification.models');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        await Promise.all([
            MentoringAssignment.createIndexes(),
            Notification.createIndexes()
        ]);
        const assignmentIndexes = await MentoringAssignment.collection.indexes();
        const singleMentorIndex = assignmentIndexes.find((index) => (
            index.unique === true &&
            index.key?.student === 1 &&
            index.key?.status === 1 &&
            index.key?.faculty === undefined &&
            index.partialFilterExpression?.status === 'active'
        ));
        if (singleMentorIndex) {
            await MentoringAssignment.collection.dropIndex(singleMentorIndex.name);
            console.log('Removed the legacy single-mentor constraint.');
        }
        console.log('database connection successful.');
    }
    catch(err){
        console.error('database connection or index setup failed.', err);
        throw err;
    }
    
}

module.exports = connectDB;