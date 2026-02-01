import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SYSTEM_PROMPT_PATH = resolve(__dirname, "../../system_role.md");

const systemPromptContent = readFileSync(SYSTEM_PROMPT_PATH, "utf8").trim();

export const systemPrompt = systemPromptContent;

export const systemMessage = {
  role: "system" as const,
  content: systemPromptContent,
};
