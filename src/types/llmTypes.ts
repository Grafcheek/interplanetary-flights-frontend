export type ChatMessage = {
  role: "user" | "system" | "assistant";
  content: string;
};

/** JSON-параметры поиска межпланетных перелётов, которые формирует LLM. */
export type PlanetSearchParams = {
  query?: string;
  title?: string;
  from_body?: string;
  to_body?: string;
};
