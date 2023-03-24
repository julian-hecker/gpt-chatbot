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
      temperature: 0.8,
      presence_penalty: 0.6,
      max_tokens: 80,
      top_p: 1,
      stop: ['Q: ', 'AI: '],
      user: From,
    });
    console.log(completion.data);

    const result = completion.data.choices[0].text;
    twiml.message(result || 'Sorry, please try again.');

    const newHistory = history + `\nQ: ${Body}\nAI: ${result}`;
    const maxAge = 1000 * 60 * 60 * 24 * 365;
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
  // multi-shot prompt
  return `The following is a conversation between a virtual AI tutor named KAIT and a human student. The AI companion is understanding, compassionate, and seeks to understand its student by asking follow up questions.

Q: Hello, who are you?
AI: I'm KAIT, a your virtual AI tutor! What's your name?
Q: I don't know how to do this math problem.
AI: I can help! Tell me a bit more about your math problem.
${history ? history + '\n' : ''}Q: ${message.trim()}
AI: `;
}
