const DEFAULT_PRODUCT_NAME = "Cardiometabolic Early Detection & Control";

export type PublicProductConfig = Readonly<{
  productName: string;
}>;

export const productConfig: PublicProductConfig = {
  productName:
    process.env.NEXT_PUBLIC_PRODUCT_NAME?.trim() || DEFAULT_PRODUCT_NAME,
};
