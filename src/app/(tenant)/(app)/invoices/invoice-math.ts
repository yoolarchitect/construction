export function computeInvoiceGrandTotal(invoice: {
  items: { amount: unknown }[];
  discount: unknown;
}): number {
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discount = Number(invoice.discount || 0);
  return subtotal - discount;
}
