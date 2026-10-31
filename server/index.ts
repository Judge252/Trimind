import {createApplication} from './application.js';
createApplication().listen(Number(process.env.PORT)||4173,process.env.HOST||'127.0.0.1',()=>console.log('TRIMIND server listening. Health: /api/health'));
