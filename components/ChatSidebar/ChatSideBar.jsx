import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPlus,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

const ChatSideBar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    // get user chat List as soon as component renders or chatId changes
    const loadChatList = async () => {
      const response = await fetch(`/api/chat/getChatList`, {
        method: "POST",
      });
      const json = await response.json();

      setChatList(json?.chats || []);
    };
    loadChatList();
  }, [chatId]);

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link
        className="side-menu-item bg-emerald-500 hover:bg-emerald-600"
        href="/chat"
      >
        <FontAwesomeIcon icon={faPlus} /> New Chat
      </Link>
      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => (
          <Link
            className={`side-menu-item ${
              chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
            }`}
            href={`/chat/${chat._id}`}
            key={chat._id}
          >
            <FontAwesomeIcon icon={faMessage} />{" "}
            <span
              title={chat.title}
              className="overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {chat.title}
            </span>
          </Link>
        ))}
      </div>
      <Link className="side-menu-item" href="/api/auth/logout">
        <FontAwesomeIcon icon={faRightFromBracket} /> Logout
      </Link>
    </div>
  );
};

export default ChatSideBar;
