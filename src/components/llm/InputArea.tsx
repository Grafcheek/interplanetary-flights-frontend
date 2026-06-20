import type { FC, KeyboardEvent } from "react";
import Form from "react-bootstrap/Form";

interface InputAreaProps {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

const InputArea: FC<InputAreaProps> = ({ input, loading, onInputChange, onSend }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || loading || !input.trim()) return;
    e.preventDefault();
    onSend();
  };

  return (
    <Form.Control
      type="text"
      className="search-input planet-filter-toolbar__input llm-input-area__input"
      placeholder="AI-поиск"
      value={input}
      onChange={(e) => onInputChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={loading}
      aria-label="AI-поиск"
    />
  );
};

export default InputArea;
