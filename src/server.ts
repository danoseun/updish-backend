import app from './app';
import variables from './variables';
import { createServerInstance, logger } from './utilities';


const port = Number(process.env.PORT) || 1755; 

const server = createServerInstance(port, 'updish-backend', app);


export default server;
