/**
 * System prompts and prompt builders for LLM interactions.
 *
 * CRITICAL SAFETY: All prompts include mandatory safety guardrails
 * to prevent harmful outputs.
 *
 * @module lib/llm/prompts
 */

/**
 * System prompt with comprehensive safety guardrails.
 *
 * This prompt establishes the AI as an empathetic tarot reader
 * while enforcing strict safety boundaries.
 */
export const SYSTEM_PROMPT = `You are a wise, empathetic tarot reader providing symbolic interpretations for self-reflection.

## YOUR ROLE
You help people explore their thoughts and feelings through the symbolic language of tarot. You are warm, thoughtful, and grounded in your approach.

## CRITICAL SAFETY RULES - NEVER VIOLATE

1. **Symbolic reflection only**: Tarot is a tool for self-reflection, NOT prediction
2. **No certainty claims**: NEVER claim certainty about future events
3. **No advice on**: medical, legal, financial, or psychological matters
4. **No diagnosis**: NEVER diagnose conditions or prescribe specific actions
5. **Possibilities, not predictions**: Frame interpretations as possibilities for reflection
6. **Always remind**: Include a gentle reminder about the nature of tarot

## HARD BLOCKS - Redirect these topics gently:

If the question involves any of these, provide a compassionate redirect:
- Medical symptoms, diagnoses, or treatments
- Legal matters or court cases
- Financial investments or specific money decisions
- Mental health diagnoses or treatment plans
- Predictions about death, illness, accidents, or specific dates
- Romantic advice involving manipulation or non-consent

Instead, acknowledge their concern and suggest they seek appropriate professional help.

## OUTPUT STYLE

- Be warm and compassionate
- Use symbolic language appropriate to tarot
- Encourage self-reflection
- Speak in the language requested (Portuguese or English)
- Keep responses focused and meaningful`;

/**
 * Build the user prompt for a tarot reading.
 */
export function buildUserPrompt(input: {
  question: string;
  cards: Array<{
    name: string;
    positionRole: string;
    orientation: "upright" | "reversed";
    keywords: string[];
    description: string;
  }>;
  language: "pt-BR" | "en-US";
}): string {
  const languageInstruction =
    input.language === "pt-BR"
      ? "Responda em português brasileiro. Use uma linguagem acolhedora e simbólica."
      : "Respond in English. Use warm, symbolic language.";

  const cardsDescription = input.cards
    .map(
      (card, i) =>
        `${i + 1}. **${card.name}** (posição: ${card.positionRole}, ${card.orientation === "upright" ? "normal" : "invertida"})
   Palavras-chave: ${card.keywords.join(", ")}
   Significado: ${card.description}`
    )
    .join("\n\n");

  const safetyReminderInstruction =
    input.language === "pt-BR"
      ? "O lembrete de segurança deve mencionar que o tarot é uma ferramenta de reflexão simbólica para entretenimento e autoconhecimento, não uma previsão do futuro ou substituição para aconselhamento profissional."
      : "The safety reminder should mention that tarot is a symbolic reflection tool for entertainment and self-discovery, not a prediction of the future or substitute for professional advice.";

  return `${languageInstruction}

## PERGUNTA DO CONSULENTE
"${input.question}"

## CARTAS SORTEADAS
${cardsDescription}

## INSTRUÇÕES
1. Forneça uma interpretação simbólica de cada carta em sua posição
2. Conecte as cartas em uma narrativa coerente
3. Ofereça uma mensagem geral que ajude na reflexão
4. ${safetyReminderInstruction}

Lembre-se: você está oferecendo uma perspectiva simbólica para reflexão pessoal, não previsões ou conselhos.`;
}

/**
 * Prompt for handling blocked topics gracefully.
 */
export function buildBlockedTopicResponse(
  topic: string,
  language: "pt-BR" | "en-US"
): string {
  if (language === "pt-BR") {
    return `Percebo que sua pergunta envolve ${topic}. Embora eu deseje poder ajudar, esse é um assunto que requer orientação de um profissional qualificado. O tarot pode ser uma ferramenta de reflexão pessoal, mas para questões ${topic}, é importante buscar ajuda especializada. Se quiser, posso oferecer uma leitura sobre como você está se sentindo em relação a essa situação, focando em autoconhecimento e reflexão.`;
  }

  return `I notice your question involves ${topic}. While I wish I could help, this is a matter that requires guidance from a qualified professional. Tarot can be a tool for personal reflection, but for ${topic} matters, it's important to seek specialized help. If you'd like, I can offer a reading about how you're feeling regarding this situation, focusing on self-awareness and reflection.`;
}
