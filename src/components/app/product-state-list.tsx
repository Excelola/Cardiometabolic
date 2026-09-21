import { Badge } from "@/components/ui/badge";
import {
  MOCK_CURRENT_PRODUCT_STATE,
  PRODUCT_STATE_DETAILS,
  PRODUCT_STATES,
} from "@/domain/product-state";

export function ProductStateList() {
  return (
    <ol className="state-list" aria-label="Approved product workflow states">
      {PRODUCT_STATES.map((state) => {
        const isCurrent = state === MOCK_CURRENT_PRODUCT_STATE;
        return (
          <li className={isCurrent ? "is-current" : undefined} key={state}>
            <div>
              <strong>{state}</strong>
              <p>{PRODUCT_STATE_DETAILS[state]}</p>
            </div>
            {isCurrent ? <Badge tone="forest">Current preview</Badge> : null}
          </li>
        );
      })}
    </ol>
  );
}
