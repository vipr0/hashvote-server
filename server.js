const mongoose = require('mongoose');
const app = require('./app');
const { PORT, DB } = require('./config');

const port = PORT || 3000;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB'));

app.listen(port, () => {
  console.log(`Server started. Listening on port ${port}`);
});
