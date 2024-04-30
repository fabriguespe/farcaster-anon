import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export async function contentFilter(content) {
  // Example of calling OpenAI's content moderation endpoint
  const moderation = await openai.moderations.create({
    input: content,
  });
  if (process.env.DEBUG === "true") {
    console.log(content, moderation.results[0]);
  }

  const isOffensive = moderation?.results[0]?.flagged;
  console.log(isOffensive);
  return {
    isOffensive: isOffensive,
    reply: isOffensive
      ? "Your message contains inappropriate content and cannot be posted."
      : "Content is acceptable.",
  };
}
