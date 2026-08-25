import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
  fetchQRCodeByHandle,
  incrementQRCodeScans,
} from "./fetchQRCode.js";
import { parseScanHandle } from "./parseScanHandle.js";

export default async () => {
  render(<Extension />, document.body);
};

/** @typedef {"idle" | "loading" | "ready" | "adding" | "success" | "error"} FlowState */

/** @typedef {{ id: string; handle: string; title: string; productTitle: string; variantLegacyId: number; destination: string; scans: number }} QRCodeRecord */

function Extension() {
  const [flowState, setFlowState] = useState(/** @type {FlowState} */ ("idle"));
  const [errorMessage, setErrorMessage] = useState("");
  const [scanSource, setScanSource] = useState("");
  const [hasCameraScanner, setHasCameraScanner] = useState(false);
  const [qrCode, setQrCode] = useState(/** @type {QRCodeRecord | null} */ (null));
  const lastProcessedScan = useRef("");
  const isProcessing = useRef(false);

  const resetFlow = useCallback(() => {
    setFlowState("idle");
    setErrorMessage("");
    setQrCode(null);
    lastProcessedScan.current = "";
  }, []);

  const processScan = useCallback(async (scanData) => {
    if (!scanData || isProcessing.current) {
      return;
    }

    if (scanData === lastProcessedScan.current) {
      return;
    }

    const handle = parseScanHandle(scanData);

    if (!handle) {
      setFlowState("error");
      setErrorMessage(shopify.i18n.translate("invalid_scan"));
      return;
    }

    isProcessing.current = true;
    lastProcessedScan.current = scanData;
    setFlowState("loading");
    setErrorMessage("");
    setQrCode(null);

    try {
      const record = await fetchQRCodeByHandle(handle);

      if (!record) {
        setFlowState("error");
        setErrorMessage(shopify.i18n.translate("not_found"));
        return;
      }

      setQrCode(record);
      setFlowState("ready");
    } catch (error) {
      setFlowState("error");
      setErrorMessage(
        error instanceof Error ? error.message : shopify.i18n.translate("not_found"),
      );
    } finally {
      isProcessing.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribeData = shopify.scanner.scannerData.current.subscribe(
      (result) => {
        if (!result.data) {
          return;
        }

        setScanSource(result.source ?? "");
        void processScan(result.data);
      },
    );

    const unsubscribeSources = shopify.scanner.sources.current.subscribe(
      (sources) => {
        setHasCameraScanner(sources.includes("camera"));
      },
    );

    return () => {
      unsubscribeData();
      unsubscribeSources();
    };
  }, [processScan]);

  const handleOpenCamera = () => {
    const scanner = shopify.scanner;

    if (
      "showCameraScanner" in scanner &&
      typeof scanner.showCameraScanner === "function"
    ) {
      scanner.showCameraScanner();
    }
  };

  const handleAddToCart = async () => {
    if (!qrCode) {
      return;
    }

    setFlowState("adding");

    try {
      const lineItemUuid = await shopify.cart.addLineItem(
        qrCode.variantLegacyId,
        1,
      );

      if (!lineItemUuid) {
        setFlowState("ready");
        return;
      }

      try {
        await shopify.cart.addLineItemProperties(lineItemUuid, {
          _qr_handle: qrCode.handle,
          _qr_source: "pos_scan",
        });
      } catch {
        // Properties are best-effort after a successful cart add.
      }

      try {
        await incrementQRCodeScans(qrCode.id, qrCode.scans);
      } catch {
        // Cart add succeeded; scan count is best-effort.
      }

      shopify.toast.show(
        shopify.i18n.translate("added", {
          product: qrCode.productTitle ?? qrCode.title,
        }),
      );
      setFlowState("success");
    } catch (error) {
      setFlowState("error");
      setErrorMessage(
        error instanceof Error ? error.message : shopify.i18n.translate("not_found"),
      );
    }
  };

  return (
    <s-page heading={shopify.i18n.translate("modal_heading")}>
      <s-scroll-box padding="base">
        {flowState === "idle" && (
          <s-stack direction="block" gap="base">
            <s-text>{shopify.i18n.translate("scan_hint")}</s-text>
            {hasCameraScanner && (
              <s-button onClick={handleOpenCamera} variant="primary">
                {shopify.i18n.translate("open_camera")}
              </s-button>
            )}
            {scanSource && (
              <s-text>Scanner: {scanSource}</s-text>
            )}
          </s-stack>
        )}

        {flowState === "loading" && (
          <s-text>{shopify.i18n.translate("loading")}</s-text>
        )}

        {flowState === "ready" && qrCode && (
          <s-stack direction="block" gap="base">
            <s-section heading={shopify.i18n.translate("product_label")}>
              <s-text>{qrCode.productTitle ?? qrCode.title}</s-text>
              <s-text>
                {shopify.i18n.translate("scans_label")}: {qrCode.scans}
              </s-text>
            </s-section>
            <s-button onClick={handleAddToCart} variant="primary">
              {shopify.i18n.translate("add_to_cart")}
            </s-button>
            <s-button onClick={resetFlow} variant="secondary">
              {shopify.i18n.translate("scan_again")}
            </s-button>
          </s-stack>
        )}

        {flowState === "adding" && (
          <s-text>{shopify.i18n.translate("adding")}</s-text>
        )}

        {flowState === "success" && qrCode && (
          <s-stack direction="block" gap="base">
            <s-text>
              {shopify.i18n.translate("added", {
                product: qrCode.productTitle ?? qrCode.title,
              })}
            </s-text>
            <s-button onClick={resetFlow} variant="primary">
              {shopify.i18n.translate("scan_again")}
            </s-button>
          </s-stack>
        )}

        {flowState === "error" && (
          <s-stack direction="block" gap="base">
            <s-text>{errorMessage}</s-text>
            <s-button onClick={resetFlow} variant="secondary">
              {shopify.i18n.translate("scan_again")}
            </s-button>
          </s-stack>
        )}
      </s-scroll-box>
    </s-page>
  );
}
