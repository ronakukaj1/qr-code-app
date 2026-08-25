export function getQRCodeScanUrl(handle, shop) {
  return `https://${shop}/apps/qr-scan/${handle}`;
}
