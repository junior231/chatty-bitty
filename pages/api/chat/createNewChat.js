import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    // get logged in user.
    const { user } = await getSession(req, res);

    // get message from request body
    const { message } = req.body;

    // validate message data
    if (!message || typeof message !== "string" || message.length > 200) {
      res.status(422).json({
        message: "Message is required and must be less than 200 characters",
      });
      return;
    }

    // create new user message object
    const newUserMessage = {
      role: "user",
      content: message,
    };

    // create mongoDB client
    const client = await clientPromise;

    // get database
    const db = client.db("ChattyBitty");

    // find collection and insert new chat record
    const chat = await db.collection("chats").insertOne({
      userId: user.sub,
      messages: [newUserMessage],
      title: message,
    });

    // return json object to front end
    res.status(200).json({
      _id: chat.insertedId.toString(),
      messages: [newUserMessage],
      title: message,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occured when creating a new chat" });
  }
}
