const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/AppError');
const userRouter = require('./routes/userRoutes');
const votingRouter = require('./routes/votingRoutes');
const errorController = require('./controllers/errorController');

const app = express();

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(compression());

// Routes
app.use('/api/v1/votings', votingRouter);
app.use('/api/v1/users', userRouter);

app.use('*', (req, res, next) => {
  next(new AppError('Not Found', 404));
});

app.use(errorController);

module.exports = app;
