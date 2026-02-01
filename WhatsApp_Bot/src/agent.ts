import { systemMessage } from "./config/systemPrompt";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentPayloadOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
}

export function buildAgentPayload(messages: Message[], options: AgentPayloadOptions = {}) {
  return {
    model: options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
    temperature: options.temperature ?? 0.4,
    stream: options.stream ?? true,
    messages: [systemMessage, ...messages],
  };
}
