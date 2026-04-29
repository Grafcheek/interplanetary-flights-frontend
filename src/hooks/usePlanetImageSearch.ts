import { useEffect, useMemo, useRef, useState } from "react";
import { cosineSimilarity } from "../modules/math";

export type ClipSearchItem = { id: number; description: string };

export interface ProcessedClipItem extends ClipSearchItem {
  score: number;
  isVisible: boolean;
  embedding?: number[];
}

function normalizeProgress(raw: unknown): number | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as { progress?: number };
  if (typeof o.progress !== "number") return null;
  if (o.progress <= 1 && o.progress >= 0) return Math.round(o.progress * 100);
  return Math.max(0, Math.min(100, Math.round(o.progress)));
}

export const usePlanetImageSearch = (initialItems: ClipSearchItem[], enabled: boolean) => {
  const [items, setItems] = useState<ProcessedClipItem[]>([]);
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workerError, setWorkerError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const embeddingsReadyRef = useRef(false);
  const pendingFileRef = useRef<File | null>(null);

  const itemsKey = useMemo(
    () => initialItems.map((item) => `${item.id}:${item.description}`).join("|"),
    [initialItems],
  );

  useEffect(() => {
    setWorkerError(null);
    embeddingsReadyRef.current = false;
    pendingFileRef.current = null;

    if (!enabled) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setItems([]);
      setReady(false);
      setProgress(0);
      setImageEmbedding(null);
      return;
    }

    if (initialItems.length === 0) {
      setItems([]);
      setReady(true);
      setProgress(100);
      setImageEmbedding(null);
      return;
    }

    setItems(initialItems.map((item) => ({ ...item, score: 0, isVisible: true })));
    setReady(false);
    setProgress(0);
    setImageEmbedding(null);

    workerRef.current = new Worker(new URL("../workers/search.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data as { type: string; data: unknown };
      if (type === "progress") {
        const p = normalizeProgress(data);
        if (p !== null) setProgress(p);
        return;
      }
      if (type === "text_embeddings_ready") {
        embeddingsReadyRef.current = true;
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            embedding: (data as Record<number, number[] | undefined>)[item.id],
          })),
        );
        setReady(true);
        setProgress(100);
        const pending = pendingFileRef.current;
        if (pending && workerRef.current) {
          pendingFileRef.current = null;
          workerRef.current.postMessage({ type: "image", data: pending });
        }
        return;
      }
      if (type === "image_embedding_ready") {
        setImageEmbedding(data as number[]);
        return;
      }
      if (type === "error") {
        setWorkerError(typeof data === "string" ? data : "Worker error");
        setReady(true);
      }
    };

    workerRef.current.postMessage({ type: "init", data: initialItems });

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [enabled, initialItems, itemsKey]);

  useEffect(() => {
    if (!imageEmbedding) return;
    setItems((prevItems) => {
      if (!prevItems[0]?.embedding) return prevItems;
      const threshold = 0.12;
      const topK = 5;
      const processed = prevItems.map((item) => {
        if (!item.embedding) return item;
        return {
          ...item,
          score: cosineSimilarity(imageEmbedding, item.embedding),
          isVisible: false,
        };
      });
      processed.sort((a, b) => b.score - a.score);
      let visible = 0;
      for (const item of processed) {
        if (visible >= topK) break;
        if (item.score >= threshold) {
          item.isVisible = true;
          visible += 1;
        }
      }
      if (visible === 0) {
        processed.slice(0, topK).forEach((item) => {
          item.isVisible = true;
        });
      }
      return processed;
    });
  }, [imageEmbedding]);

  const searchByImage = (file: File) => {
    if (!workerRef.current || !embeddingsReadyRef.current) {
      pendingFileRef.current = file;
      return;
    }
    workerRef.current.postMessage({ type: "image", data: file });
  };

  const resetSearch = () => {
    setImageEmbedding(null);
    setItems((prev) =>
      [...prev].sort((a, b) => a.id - b.id).map((item) => ({ ...item, score: 0, isVisible: true })),
    );
  };

  return { items, ready, progress, imageEmbedding, workerError, searchByImage, resetSearch };
};
