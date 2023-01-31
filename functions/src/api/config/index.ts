import { config as dotenv } from 'dotenv';
const isEnv = dotenv();

if (!isEnv) throw new Error('Could not find .env file!');

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? null,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
};

export const {
  openaiApiKey,
  twilioAccountSid,
  twilioAuthToken,
  twilioPhoneNumber,
} = config;
