import { useLayoutEffect, useRef } from "react";
import { mount, unmount } from "svelte";
import CartIcon from "./CartIcon.svelte";

type CartIconSvelteHostProps = {
  count: number;
  disabled: boolean;
  onClick: () => void;
};

export default function CartIconSvelteHost({ count, disabled, onClick }: CartIconSvelteHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!hostRef.current) return;

    const app = mount(CartIcon, {
      target: hostRef.current,
      props: { count, disabled, onClick },
    });

    return () => {
      unmount(app);
    };
  }, [count, disabled, onClick]);

  return <div ref={hostRef} />;
}
