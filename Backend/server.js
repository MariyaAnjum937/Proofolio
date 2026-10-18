require('dotenv').config();
console.log({
  privateKeyLoaded: Boolean(process.env.IMAGEKIT_PRIVATE_KEY),
  publicKeyLoaded: Boolean(process.env.IMAGEKIT_PUBLIC_KEY),
  urlEndpointLoaded: Boolean(process.env.IMAGEKIT_URL_ENDPOINT)
});
const app = require('./src/app');
const connectDB = require('./src/db/db');


connectDB()
    .then(()=>{
        app.listen(3000, ()=>{
        console.log('server running on port 3000');
        })
    })