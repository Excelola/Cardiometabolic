import { MOCK_CURRENT_PRODUCT_STATE, PRODUCT_STATES } from "@/domain/product-state";

export function ProductStateList() {
  return (
    <ol className="state-list">
      {PRODUCT_STATES.map((state) => {
        const isCurrent = state === MOCK_CURRENT_PRODUCT_STATE;
        return (
          <li className={isCurrent ? "is-current" : undefined} key={state}>
            <span>{state}</span>
            {isCurrent ? <strong>Mock current state</strong> : null}
          </li>
        );
      })}
    </ol>
  );
}
