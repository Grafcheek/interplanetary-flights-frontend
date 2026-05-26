import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

interface PlanetFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onImageUploadClick: () => void;
  onClearImage: () => void;
  clipButtonLabel: string;
  disableClipSearch?: boolean;
  disableClipReset?: boolean;
  showImageSearch?: boolean;
}

export default function PlanetFilterBar({
  query,
  onQueryChange,
  onSearch,
  onImageUploadClick,
  onClearImage,
  clipButtonLabel,
  disableClipSearch = false,
  disableClipReset = false,
  showImageSearch = true,
}: PlanetFilterBarProps) {
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
      {showImageSearch ? (
        <>
          <Button
            type="button"
            className="search-btn"
            onClick={onImageUploadClick}
            disabled={disableClipSearch}
          >
            {clipButtonLabel}
          </Button>
          <Button
            type="button"
            className="search-btn search-btn--ghost"
            onClick={onClearImage}
            disabled={disableClipReset}
          >
            Сбросить фото
          </Button>
        </>
      ) : null}
    </Form>
  );
}
