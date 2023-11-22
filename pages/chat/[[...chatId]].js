import ChatSidebar from "components/ChatSidebar/ChatSideBar";
import Head from "next/head";
import { useEffect, useState } from "react";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";
import Message from "components/Message/Message";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function ChatPage({
  // make messages prop an array by default
  chatId,
  title,
  messages = [],
}) {
  const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [fullMessage, setFullMessage] = useState("");
  const [originalChatId, setOriginalChatId] = useState(chatId);

  const router = useRouter();

  // check if chatId route has changed
  const routeHasChanged = chatId !== originalChatId;

  // reset states whenever chatId route changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // if new chat is done generating and full message exists, update new chat messages array
  useEffect(() => {
    if (!routeHasChanged && !generatingResponse && fullMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessage,
        },
      ]);
      setFullMessage("");
    }
  }, [generatingResponse, fullMessage, routeHasChanged]);

  useEffect(() => {
    // if new chat response is done generating and newChatId is !null, re-direct to /chat/chatId page
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // initiate loading state
    setGeneratingResponse(true);

    setOriginalChatId(chatId);

    // add new chat messages to existing array of chatMessages.
    setNewChatMessages((prev) => {
      const latestChatMessages = [
        ...prev,
        {
          _id: uuid(),
          role: "user",
          content: messageText,
        },
      ];
      return latestChatMessages;
    });

    // clear inputted message from texarea
    setMessageText("");

    // send request to sendMessage api
    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ chatId, message: messageText }),
    });
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();

    let content = "";

    // use streamReader from open AI to stream returned response
    await streamReader(reader, async (message) => {
      // omit newChatId event from streamed response
      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        // update incomingMessage with returned message content
        setIncomingMessage((s) => `${s}${message.content}`);
        content = content + message.content;
      }
    });

    // set full message as returned message.content
    setFullMessage(content);

    // reset incoming messages after submit
    setIncomingMessage("");
    setGeneratingResponse(false);
  };

  // combine messages prop and newChatMessages
  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-y-auto text-white">
            {!allMessages.length && !incomingMessage && (
              <div className="m-auto flex items-center justify-center text-center">
                <div>
                  <FontAwesomeIcon
                    icon={faRobot}
                    className="text-6xl text-emerald-200"
                  />
                  <h1 className="mt-2 text-4xl font-bold text-white/50">
                    Ask me a question!
                  </h1>
                </div>
              </div>
            )}

            {!!allMessages.length && (
              <div className="mb-auto ">
                {allMessages.map((message) => (
                  <Message
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {!!incomingMessage && !routeHasChanged && (
                  <Message role="assistant" content={incomingMessage} />
                )}
                {!!incomingMessage && !!routeHasChanged && (
                  <Message
                    content="Only one message at a time. Please allow any other responses to complete before sending another message"
                    role="notice"
                  />
                )}
              </div>
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset disabled={generatingResponse} className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button className="btn" type="submit">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  // get chatId from route if it exixts
  const chatId = ctx.params?.chatId?.[0] || null;

  // if chatId exists, find and return chat from database
  if (chatId) {
    // check if chatId is a valid mongoDb Object id, else redirect to chat page
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = await client.db("ChattyBitty");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });

    // check if chat record was found in db, else redirect
    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    // return chatID, title and message when page loads
    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }

  return {
    props: {},
  };
};
