import type { FC } from "react";

interface ModelLoaderProps {
  progress: number;
}

const ModelLoader: FC<ModelLoaderProps> = ({ progress }) => (
  <div className="llm-panel__loading">
    {(progress * 100).toFixed(0)}%
    <progress value={progress} max={1} />
  </div>
);

export default ModelLoader;
