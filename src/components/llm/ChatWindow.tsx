import type { FC } from "react";
import type { ChatMessage } from "../../types/llmTypes";
import Message from "./Message";
import { Container } from "react-bootstrap";

interface ChatWindowProps {
  messages: ChatMessage[];
}

const ChatWindow: FC<ChatWindowProps> = ({ messages }) => (
  <Container className="llm-chat-window">
    {messages
      .filter((msg) => msg.role !== "system")
      .map((msg, idx) => (
        <Message key={`${msg.role}-${idx}`} msg={msg} />
      ))}
  </Container>
);

export default ChatWindow;
