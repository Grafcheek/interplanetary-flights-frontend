import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

interface PlanetFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export default function PlanetFilterBar({ query, onQueryChange, onSearch }: PlanetFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Form onSubmit={handleSubmit} className="planet-filter-toolbar__fields search-form">
      <Form.Control
        type="text"
        name="query"
        className="search-input"
        placeholder="Поиск маршрутов и планет"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Поиск по названию и маршруту"
      />
      <Button type="submit" className="search-btn">
        Найти
      </Button>
    </Form>
  );
}
