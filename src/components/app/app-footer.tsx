import { productConfig } from "@/config/product";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>{productConfig.productName} private frontend preview</span>
      <span>No medical advice, diagnosis, or treatment.</span>
    </footer>
  );
}
