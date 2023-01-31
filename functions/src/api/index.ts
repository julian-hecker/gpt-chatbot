import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { OpenAIApi, Configuration } from 'openai';
import { twiml } from 'twilio';

import { openaiApiKey } from './config';

if (!openaiApiKey) throw new Error('No OpenAI API Key!');
const openAIConfig = new Configuration({
  apiKey: openaiApiKey,
});
const openai = new OpenAIApi(openAIConfig);

const { MessagingResponse } = twiml;

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors({ origin: true }));
app.use(helmet());
app.use(morgan('combined'));
// app.use(decodeToken);

app.get('/', (req, res) => {
  res.sendStatus(200);

  // const client = require('twilio')(accountSid, authToken);

  // client.messages
  //   .create({
  //     body: 'Hello from Twilio',
  //     from: '+18447740907',
  //     to: '+15169748454',
  //   })
  //   .then((message) => console.log(message.sid));
});

app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const { From, To, Body } = req.body;

  console.log(Body);

  const prompt = `ML Tutor: I am a ML/AI language model tutor
You: What is a language model?
ML Tutor: A language model is a statistical model that describes the probability of a word given the previous words.
You: What is a statistical model?
`;

  // how to deal with start_text, stop_text, stop, etc

  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.9,
      presence_penalty: 0.6,
      max_tokens: 150,
      user: From,
    });

    const result = completion.data.choices[0].text;
    console.log(completion.data);
    twiml.message(result || 'Sorry, please try again.');
  } catch (err) {
    console.error((err as any)?.response?.data?.error?.message);
    twiml.message(
      `Error: ${(err as any)?.response?.data?.error?.message}`,
    );
  } finally {
    res.type('text/xml').send(twiml.toString());
  }
});

// app.use(router);

// app.use(notFoundHandler);
// app.use(errorHandler);
