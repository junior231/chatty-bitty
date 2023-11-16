import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    // get message from req.json when sendMessage api is called
    const { message } = await req.json();

    //prefix every message sent to openAI with a prefixed message

    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Bitty. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by Collins Ilo. Your response must be formatted as markdown",
    };

    // create stream variable: specify endpoint and configure headers, method and body
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialChatMessage, { content: message, role: "user" }],
          stream: true,
        }),
      }
    );

    return new Response(stream);
  } catch (error) {
    console.log("AN ERROR OCCURED IN SENDMESSAGE: ", error);
  }
}
