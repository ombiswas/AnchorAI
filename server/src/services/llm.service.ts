import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { config } from '../config';

export interface LlmCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export class LlmService {
  private openai: OpenAI | null = null;
  private groq: Groq | null = null;

  constructor() {
    if (config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    if (config.groqApiKey && config.groqApiKey !== 'your_groq_api_key_here') {
      this.groq = new Groq({ apiKey: config.groqApiKey });
    }
  }

  /**
   * Generates a completion from the selected provider (OpenAI or Groq).
   */
  public async generateCompletion(options: LlmCompletionOptions): Promise<string> {
    const { systemPrompt, userPrompt, temperature = 0.1 } = options;
    const preferredProvider = config.llmProvider;
    const activeProvider =
      preferredProvider === 'groq'
        ? this.groq
          ? 'groq'
          : this.openai
            ? 'openai'
            : null
        : this.openai
          ? 'openai'
          : this.groq
            ? 'groq'
            : null;

    // 1. Groq Provider
    if (activeProvider === 'groq' && this.groq) {
      try {
        if (preferredProvider === 'openai') {
          console.log(
            '[llm] Preferred provider OpenAI is not configured; using available Groq API.'
          );
        }
        const modelToTry = config.groqModel;
        console.log(`[llm] Calling Groq API (${modelToTry})...`);
        try {
          const response = await this.groq.chat.completions.create({
            model: modelToTry,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: 1024,
          });

          return response.choices[0]?.message?.content || "I don't know based on your notes.";
        } catch (groqErr) {
          const err = groqErr as { status?: number; error?: { error?: { code?: string } } };
          if (err.status === 404 || err.error?.error?.code === 'model_not_found') {
            console.warn(
              `[llm] Model ${modelToTry} not available. Retrying with openai/gpt-oss-20b...`
            );
            const fallbackResponse = await this.groq.chat.completions.create({
              model: 'openai/gpt-oss-20b',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature,
              max_tokens: 1024,
            });
            return (
              fallbackResponse.choices[0]?.message?.content || "I don't know based on your notes."
            );
          }
          throw groqErr;
        }
      } catch (error) {
        console.error('[llm] Groq API call failed:', error);
        throw error;
      }
    }

    // 2. OpenAI Provider
    if (activeProvider === 'openai' && this.openai) {
      try {
        if (preferredProvider === 'groq') {
          console.log(
            '[llm] Preferred provider Groq is not configured; using available OpenAI API.'
          );
        }
        console.log('[llm] Calling OpenAI API (gpt-4o-mini)...');
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 1024,
        });

        return response.choices[0]?.message?.content || "I don't know based on your notes.";
      } catch (error) {
        console.error('[llm] OpenAI API call failed:', error);
        throw error;
      }
    }

    // 3. Fallback for local development when neither key is provided
    console.warn(
      '[llm] Neither OPENAI_API_KEY nor GROQ_API_KEY is configured. Generating local simulated grounded response.'
    );

    return `[Dev Mode Response]\nBased on your notes, here is the relevant context retrieved:\n\n${userPrompt.slice(
      0,
      300
    )}...\n\n(Configure OPENAI_API_KEY or GROQ_API_KEY in server/.env to enable live LLM generation.)`;
  }

  /**
   * Sanitizes user input to prevent prompt injection or markdown delimiter escaping.
   * Strips non-printable ASCII control characters without violating no-control-regex.
   */
  public sanitizeUserInput(input: string): string {
    let sanitized = '';
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      // Keep printable characters and standard whitespace (tab, newline, carriage return)
      if (code >= 32 || code === 9 || code === 10 || code === 13) {
        sanitized += input[i];
      }
    }
    return sanitized.replace(/<\|endoftext\|>/gi, '').trim();
  }
}

export const llmService = new LlmService();
