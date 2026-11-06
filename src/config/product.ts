export const DEFAULT_PRODUCT_NAME = "HILERA";

export type PublicProductConfig = Readonly<{
  productName: string;
}>;

export const productConfig: PublicProductConfig = {
  productName:
    process.env.NEXT_PUBLIC_PRODUCT_NAME?.trim() || DEFAULT_PRODUCT_NAME,
};
