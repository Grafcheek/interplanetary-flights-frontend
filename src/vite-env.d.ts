/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "*.mp4" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}
