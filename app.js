const path = require('path');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/AppError');
const userRouter = require('./routes/userRoutes');
const votingRouter = require('./routes/votingRoutes');
const groupRouter = require('./routes/groupRoutes');
const errorController = require('./controllers/errorController');

const app = express();

// Implement CORS
app.use(cors());
app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Security HTTP headers
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter);
// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(compression());

// Routes
app.use('/api/v1/votings', votingRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/groups', groupRouter);

app.use('*', (req, res, next) => {
  next(new AppError('Такої сторінки не знайдено', 404));
});

app.use(errorController);

module.exports = app;
