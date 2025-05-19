/**
 * @file server.js
 * @description Initializes the Express server.
 */
import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes.js';
import { error_handler } from '../error/error_handler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', routes);
app.use(error_handler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});