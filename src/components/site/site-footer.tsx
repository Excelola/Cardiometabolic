import { productConfig } from "@/config/product";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>{productConfig.productName} — frontend foundation preview.</p>
        <p>No medical advice, diagnosis, or treatment is provided by this shell.</p>
      </div>
    </footer>
  );
}
