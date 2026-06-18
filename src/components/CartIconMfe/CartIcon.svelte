<script lang="ts">
  import { ShoppingCart } from "@lucide/svelte";

  type CartIconProps = {
    count?: number;
    disabled?: boolean;
    onClick?: () => void;
  };

  const { count = 0, disabled = false, onClick = () => {} }: CartIconProps = $props();

  function handleClick() {
    if (disabled) return;
    onClick();
  }
</script>

<button
  type="button"
  class="interplanetary-flight-request-link"
  class:interplanetary-flight-request-link--disabled={disabled}
  aria-label={disabled ? "Заявка недоступна" : "Открыть текущую заявку"}
  title={disabled ? "Заявка недоступна" : "Открыть текущую заявку"}
  onclick={handleClick}
>
  <ShoppingCart size={22} stroke-width={2} />
  <span class="interplanetary-flight-request-link__badge" aria-label="Количество планет в заявке">
    {count}
  </span>
</button>
