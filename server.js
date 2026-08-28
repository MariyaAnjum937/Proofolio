require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');


connectDB()
    .then(()=>{
        app.listen(3000, ()=>{
        console.log('server running on port 3000');
        })
    })