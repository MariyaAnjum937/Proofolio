const express = require('express');
const app = express();
const authroutes = require('./routes/auth.routes');
const achievementsroutes = require('./routes/achievements.routes');
const roleRoutes = require('./routes/roles.routes');
const mentoringRoutes = require('./routes/mentoring.routes');


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

app.use('/api', authroutes);
app.use('/api', achievementsroutes);
app.use('/api', roleRoutes);
app.use('/api', mentoringRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Certificate files must be 10 MB or smaller.' });
  }

  if (error.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(400).json({ message: error.message });
  }

  console.error('Unhandled request error:', error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});


module.exports = app;