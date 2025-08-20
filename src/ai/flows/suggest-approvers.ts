
'use client';
import {z} from 'genkit/zod';
export const SuggestApproversInputSchema = z.object({});
export type SuggestApproversInput = z.infer<typeof SuggestApproversInputSchema>;
export const SuggestApproversOutputSchema = z.object({});
export type SuggestApproversOutput = z.infer<
  typeof SuggestApproversOutputSchema
>;
export async function suggestApprovers(
  input: SuggestApproversInput
): Promise<SuggestApproversOutput> {
  throw new Error('Not implemented');
}
