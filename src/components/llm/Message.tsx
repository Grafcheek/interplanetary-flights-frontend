import type { FC } from "react";
import type { ChatMessage } from "../../types/llmTypes";
import { Container } from "react-bootstrap";

interface MessageProps {
  msg: ChatMessage;
}

const Message: FC<MessageProps> = ({ msg }) => (
  <Container className={`llm-msg llm-msg--${msg.role}`}>
    <strong>{msg.role === "user" ? "Вы" : "WebLLM"}: </strong>
    <span className="llm-msg__text">{msg.content}</span>
  </Container>
);

export default Message;
