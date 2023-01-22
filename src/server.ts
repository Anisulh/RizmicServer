import express, { Application } from 'express';
import router from './components/users/route';
import dbConnection from './config/dbConnection';
import httpLogger from './middleware/httpLogger';
import routeError from './middleware/routeError';
import cors, { CorsOptions } from 'cors';
import './process';

const app: Application = express();

dbConnection();
app.use(httpLogger);
const allowedOrigins = ['http://localhost:5173'];

const options: CorsOptions = {
    origin: allowedOrigins
};

app.use(cors(options));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routing
app.use('/user', router);

//router errorhandling
app.use(routeError);

export default app;
