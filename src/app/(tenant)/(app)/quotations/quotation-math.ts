export function computeQuotationTotal(quotation: {
  items: { amount: unknown }[];
  discount: unknown;
}): number {
  const subtotal = (quotation.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discount = Number(quotation.discount || 0);
  return subtotal - discount;
}
