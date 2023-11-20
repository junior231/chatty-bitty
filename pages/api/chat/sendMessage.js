import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    // get message and chatId as chatIdFromParam from req.json when sendMessage api is called
    const { chatId: chatIdFromParam, message } = await req.json();

    // assign chatIdFromParam value to chatId
    let chatId = chatIdFromParam;

    //prefix every message sent to openAI with a prefixed message
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Bitty. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by Collins Ilo. Your response must be formatted as markdown",
    };

    let newChatId;
    let chatMessages = [];

    if (chatId) {
      // if chatId exists add message to existing messages array
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );

      const json = await response.json();

      // assign returned messages array to chatMessages
      chatMessages = json.chat.messages || [];
    } else {
      // create new chat when user sends a message
      // get domain origin from req.headers.get()
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            // get cookie from req.headers because this is a protected route
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      const json = await response.json();

      // assign json.Id value as chatId
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    // handle AI convo history logic
    const messagesToIncludeInConvoHistory = [];
    // sort array from latest to oldest
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToIncludeInConvoHistory.push(chatMessage);
      } else {
        break;
      }
    }

    // sort array from oldest to latest
    messagesToIncludeInConvoHistory.reverse();

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
          messages: [initialChatMessage, ...messagesToIncludeInConvoHistory],
          stream: true,
        }),
      },
      {
        // emit chatId to front end
        onBeforeStream: ({ emit }) => {
          // if newchatId exists, emit newChatId
          if (newChatId) {
            emit(newChatId, "newChatId");
          }
        },

        // add full content to newly created chat with addMessageToChat endpoint
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie"),
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );

    return new Response(stream);
  } catch (error) {
    console.log("AN ERROR OCCURED IN SENDMESSAGE: ", error);
  }
}
