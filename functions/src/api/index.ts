import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
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
app.use(cookieParser());
app.use(cors({ origin: true }));
app.use(helmet());
app.use(morgan('combined'));

app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const { From, Body } = req.body;

  const history = ((req.cookies['__session'] as string) ?? '')
    .split('\n')
    .slice(-10)
    .join('\n');

  const prompt = generatePrompt(Body, history);
  console.log(prompt);

  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.9,
      presence_penalty: 0.6,
      max_tokens: 80,
      top_p: 1,
      stop: ['Q: ', 'A: '],
      user: From,
    });
    console.log(completion.data);

    const result = completion.data.choices[0].text;
    twiml.message(result || 'Sorry, please try again.');

    const maxAge = 1000 * 60 * 60 * 24 * 365;
    const newHistory = history + `\nQ: ${Body}\nA: ${result}`;
    res.cookie('__session', newHistory, { maxAge });
  } catch (err) {
    console.error(JSON.stringify(err));
    twiml.message(
      `Error: ${(err as any)?.response?.data?.error?.message}`,
    );
  } finally {
    res.type('text/xml').send(twiml.toString());
  }
});

function generatePrompt(message: string, history = '') {
  return `I am an AI assistant. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with "Unknown." If I cannot help with a task, I will respond with "I can't do that."

Q: Hello, who are you?
A: I am an AI assistant.
Q: Take me to the moon.
A: I can't do that.
Q: Who was the first human?
A: Unknown.
${history ? history + '\n' : ''}Q: ${message.trim()}
A: `;
}
