const express = require('express');
const app = express();
const authroutes = require('./routes/auth.routes');
const achievementsroutes = require('./routes/achievements.routes');
const cookieParser = require('cookie-parser')
const cors = require("cors");

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use('/api',authroutes);
app.use('/api', achievementsroutes);



module.exports = app;