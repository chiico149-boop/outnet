// Local / VPS entry point:  npm start
const app = require('./app');
const { connectDB } = require('./utils/db');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`✔ THE OUT FIT running at http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('✖', err.message);
    process.exit(1);
  });
