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
    <Form onSubmit={handleSubmit} className="planet-filter-toolbar__fields">
      <div className="planet-filter-toolbar__row planet-filter-toolbar__row--text">
        <Form.Control
          type="text"
          name="query"
          className="search-input planet-filter-toolbar__input"
          placeholder="Поиск маршрутов и планет"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Поиск по названию и маршруту"
        />
        <Button type="submit" className="search-btn planet-filter-toolbar__submit">
          Найти
        </Button>
      </div>
      {showImageSearch ? (
        <div className="planet-filter-toolbar__row planet-filter-toolbar__row--image">
          <Button
            type="button"
            className="search-btn planet-filter-toolbar__image-btn"
            onClick={onImageUploadClick}
            disabled={disableClipSearch}
          >
            {clipButtonLabel}
          </Button>
          <Button
            type="button"
            className="search-btn search-btn--ghost planet-filter-toolbar__image-btn"
            onClick={onClearImage}
            disabled={disableClipReset}
          >
            Сбросить фото
          </Button>
        </div>
      ) : null}
    </Form>
  );
}
