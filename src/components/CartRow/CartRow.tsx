import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchFlightRequestCart } from "../../store/slices/flightRequestSlice";
import { interplanetaryFlightPath } from "../../routePaths";
import { subscribeFlightCart } from "../../modules/mock";
import CartIconSvelteHost from "../CartIconMfe/CartIconSvelteHost";

export default function CartRow({ className = "" }: { className?: string }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cart = useAppSelector((s) => s.flightRequest.cart);

  useEffect(() => {
    const sync = () => {
      void dispatch(fetchFlightRequestCart());
    };
    sync();
    const unsubscribe = subscribeFlightCart(sync);
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const count = cart?.planets_count ?? 0;
  const hasDraft = Boolean(cart?.has_draft && count > 0 && cart?.id != null);
  const rootClass = ["toolbar-basket", className].filter(Boolean).join(" ");
  const handleClick = useCallback(() => {
    if (!hasDraft || cart?.id == null) return;
    navigate(interplanetaryFlightPath(cart.id));
  }, [cart?.id, hasDraft, navigate]);

  return (
    <div className={rootClass}>
      <CartIconSvelteHost count={count} disabled={!hasDraft} onClick={handleClick} />
    </div>
  );
}
