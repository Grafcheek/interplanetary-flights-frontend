import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchFlightRequestCart } from "../../store/slices/flightRequestSlice";
import { interplanetaryFlightPath } from "../../routePaths";
import { subscribeFlightCart } from "../../modules/mock";

export default function CartRow({ className = "" }: { className?: string }) {
  const dispatch = useAppDispatch();
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

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 7h16v2H4V7zm2 4h12v2H6v-2zm3 4h6v2H9v-2z" fill="currentColor" />
    </svg>
  );
  const badge = (
    <span className="interplanetary-flight-request-link__badge" aria-label="Количество планет в заявке">
      {count}
    </span>
  );

  const rootClass = ["toolbar-basket", className].filter(Boolean).join(" ");

  if (hasDraft && cart?.id != null) {
    return (
      <div className={rootClass}>
        <Link
          to={interplanetaryFlightPath(cart.id)}
          className="interplanetary-flight-request-link"
          aria-label="Открыть текущую заявку"
          title="Открыть текущую заявку"
        >
          {icon}
          {badge}
        </Link>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div
        className="interplanetary-flight-request-link interplanetary-flight-request-link--disabled"
        aria-label="Заявка недоступна"
        title="Заявка недоступна"
      >
        {icon}
        {badge}
      </div>
    </div>
  );
}
