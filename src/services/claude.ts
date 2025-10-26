import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeConfig {
  apiKey: string;
}

export class ClaudeService {
  private client: Anthropic | null = null;

  constructor(private config?: ClaudeConfig) {
    if (config?.apiKey) {
      this.client = new Anthropic({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
      });
    }
  }

  setApiKey(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateNote(prompt: string, context?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const systemPrompt = `You are a helpful AI assistant collaborating with humans on a whiteboard.
Your role is to help brainstorm, organize ideas, and create sticky notes based on user requests.
Keep your responses concise and suitable for sticky notes (1-3 sentences or bullet points).
${context ? `\n\nContext from the board: ${context}` : ''}`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  }

  async generateMultipleNotes(
    prompt: string,
    count: number,
    theme?: string
  ): Promise<string[]> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const systemPrompt = `You are a helpful AI assistant collaborating with humans on a whiteboard.
Generate ${count} distinct sticky note ideas based on the user's request.
${theme ? `Theme: ${theme}` : ''}
Format your response as a numbered list, with each note on a new line.
Keep each note concise (1-3 sentences or a few bullet points).`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return [];
    }

    // Parse the numbered list
    const notes = textContent.text
      .split('\n')
      .filter((line) => line.trim().match(/^\d+\./))
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((note) => note.length > 0);

    return notes;
  }

  async organizeBoardByThemes(notes: string[]): Promise<{ [theme: string]: number[] }> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const systemPrompt = `You are helping organize sticky notes on a whiteboard by themes.
Analyze the following notes and group them by common themes.
Return ONLY a JSON object where keys are theme names and values are arrays of note indices (0-based).
Example: {"Ideas": [0, 2], "Tasks": [1, 3], "Questions": [4]}`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Notes to organize:\n${notes.map((note, i) => `${i}. ${note}`).join('\n')}`,
        },
      ],
      system: systemPrompt,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {};
    }

    try {
      // Extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse theme organization:', error);
    }

    return {};
  }
}

export const claudeService = new ClaudeService();
