import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);

    const client = await clientPromise;

    const db = client.db("ChattyBitty");

    // destructure chat id, role and content from request body.
    const { chatId, role, content } = req.body;

    // validate chatId
    let objectId;
    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      res.status(422).json({
        message: "Invalid chat ID",
      });
      return;
    }

    // validate content
    if (
      !content ||
      typeof content !== "string" ||
      (role === "user" && content.length > 200) ||
      (role === "assistant" && content.length > 100000)
    ) {
      res.status(422).json({
        message: "Content is required and must be less than 200 characters",
      });
      return;
    }

    // validate role
    if (role !== "user" && role !== "assistant") {
      res.status(422).json({
        message: "Role must be either assistant or user",
      });
      return;
    }

    // find chat by id in database and update it
    const chat = await db.collection("chats").findOneAndUpdate(
      {
        _id: objectId,
        userId: user.sub,
      },
      {
        $push: {
          messages: {
            role,
            content,
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    res.status(200).json({
      chat: {
        ...chat.value,
        _id: chat.value._id.toString(),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred when adding a message to a chat" });
  }
}
