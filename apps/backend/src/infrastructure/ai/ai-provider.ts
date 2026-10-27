export interface AIProvider {
  completeJSON(prompt: string, temperature: number): Promise<string>;
}
