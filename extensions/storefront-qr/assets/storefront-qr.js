(function () {
  const blocks = document.querySelectorAll("[data-storefront-qr]");

  blocks.forEach(async (block) => {
    const productId = block.dataset.productId;
    const proxySubpath = block.dataset.proxySubpath || "qr-scan";
    const emptyMessage =
      block.dataset.emptyMessage || "No QR code for this product.";
    const titleEl = block.querySelector("[data-qr-title]");
    const imageEl = block.querySelector("[data-qr-image]");
    const scansEl = block.querySelector("[data-qr-scans]");
    const messageEl = block.querySelector("[data-qr-message]");

    if (!productId) {
      showMessage(messageEl, "Missing product ID.");
      return;
    }

    try {
      const params = new URLSearchParams({
        product_id: productId,
        subpath: proxySubpath,
      });

      const response = await fetch(
        `/apps/${proxySubpath}/qr?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
        },
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Could not load QR code.");
      }

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load QR code.");
      }

      if (titleEl) {
        titleEl.textContent = result.title;
      }

      if (imageEl) {
        imageEl.src = result.image;
        imageEl.alt = `QR code for ${result.title}`;
      }

      if (scansEl) {
        scansEl.textContent = `${result.scans} scans`;
      }

      block.hidden = false;
    } catch (error) {
      showMessage(
        messageEl,
        error instanceof Error ? error.message : emptyMessage,
      );
    }
  });

  function showMessage(element, text) {
    if (!element) {
      return;
    }

    element.hidden = false;
    element.textContent = text;
  }
})();
