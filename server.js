const mongoose = require('mongoose');
const app = require('./app');
const { PORT, DB, DB_PASSWORD } = require('./config');

const port = PORT || 3000;
const dbUrl = DB.replace('<password>', DB_PASSWORD);

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB'));

app.listen(port, () => {
  console.log(`Server started. Listening on port ${port}`);
});
