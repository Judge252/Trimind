import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApplication } from '../server/application.js';
// Reuse the exact verifier, transaction/RLS and domain handlers. No listening port.
const application = createApplication();
const dispatch = application.listeners('request')[0] as (request:IncomingMessage,response:ServerResponse)=>Promise<void>;
export default function handler(request: IncomingMessage, response: ServerResponse) {
  return dispatch(request, response);
}
