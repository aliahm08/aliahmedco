import {FormEvent, useState} from 'react';
import {GoogleGenAI} from '@google/genai';
import {
  buildProfileContext,
  GitHubRepo,
  GitHubUser,
  profile,
} from '../content/profile';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

const apiKey = process.env.GEMINI_API_KEY;

const fallbackReply =
  'Interview Ali is ready, but no `GEMINI_API_KEY` is configured yet. Add one to enable live answers based on the profile template.';

type Props = {
  githubUser?: GitHubUser | null;
  repos: GitHubRepo[];
  repoSummary: string;
};

export default function InterviewAli({githubUser, repos, repoSummary}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Ask about Ali’s background, working style, or where he can help.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || status === 'loading') {
      return;
    }

    const nextMessages = [...messages, {role: 'user' as const, text: trimmed}];
    setMessages(nextMessages);
    setQuestion('');

    if (!apiKey) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: fallbackReply,
        },
      ]);
      return;
    }

    setStatus('loading');

    try {
      const client = new GoogleGenAI({apiKey});
      const profileContext = buildProfileContext({githubUser, repos, repoSummary});
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: [
                  'You are "Interview Ali", an interview assistant for Ali Ahmed.',
                  'Answer in first person when describing Ali, but stay grounded in the provided profile, LinkedIn note, and recent GitHub activity.',
                  'Do not invent LinkedIn facts. If LinkedIn data is missing, say so directly.',
                  'Keep answers concise, direct, and easy to scan.',
                  '',
                  'PROFILE',
                  profileContext,
                  '',
                  `QUESTION: ${trimmed}`,
                ].join('\n'),
              },
            ],
          },
        ],
      });

      const answer = response.text?.trim() || 'No response returned.';
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: answer,
        },
      ]);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          text: 'The chat request failed. Check the API key and model access, then try again.',
        },
      ]);
      setStatus('error');
    }
  }

  return (
    <section id="interview" className="panel">
      <div className="section-heading">
        <p className="eyebrow">Interview Ali</p>
        <h2>Ask what Ali seems to be working on right now.</h2>
      </div>

      <div className="chat-shell">
        <div className="prompt-row" aria-label="Suggested prompts">
          {profile.interviewPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="prompt-chip"
              onClick={() => setQuestion(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-log" aria-live="polite">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
              <span className="bubble-role">
                {message.role === 'assistant' ? 'Interview Ali' : 'You'}
              </span>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="interview-question">
            Ask Interview Ali a question
          </label>
          <textarea
            id="interview-question"
            className="chat-input"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What would Ali be great at improving first?"
          />
          <div className="chat-actions">
            <p className="chat-note">
              {apiKey
                ? 'Live AI answers use the LinkedIn note plus recent GitHub activity.'
                : 'Live AI is disabled until `GEMINI_API_KEY` is configured.'}
            </p>
            <button className="send-button" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Thinking…' : 'Ask'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
