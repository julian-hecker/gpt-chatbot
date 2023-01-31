import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { app } from './api';

export const api = functions.https.onRequest(app);
