(function () {
  const blocks = document.querySelectorAll("[data-storefront-wishlist]");

  blocks.forEach((block) => {
    const productId = block.dataset.productId;
    const proxySubpath = block.dataset.proxySubpath || "qr-scan";
    const isLoggedIn = block.dataset.loggedIn === "true";
    const loginMessage =
      block.dataset.loginMessage || "Log in to save items to your wishlist.";
    const addedMessage =
      block.dataset.addedMessage || "Added to your wishlist.";
    const buttonLabel = block.dataset.buttonLabel || "Add to wishlist";
    const addedLabel = block.dataset.addedLabel || "In wishlist";
    const button = block.querySelector("[data-wishlist-button]");
    const messageEl = block.querySelector("[data-wishlist-message]");

    if (!productId || !button) {
      return;
    }

    if (!isLoggedIn) {
      button.disabled = true;
      showMessage(messageEl, loginMessage, false);
      return;
    }

    button.addEventListener("click", async () => {
      button.disabled = true;
      clearMessage(messageEl);

      try {
        const response = await fetch(`/apps/${proxySubpath}/wishlist`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product_id: productId }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Could not add to wishlist.");
        }

        setAddedState(button, true, buttonLabel, addedLabel);
        showMessage(messageEl, addedMessage, false);
      } catch (error) {
        button.disabled = false;
        showMessage(
          messageEl,
          error instanceof Error ? error.message : "Could not add to wishlist.",
          true,
        );
      }
    });

    refreshWishlistState(
      button,
      messageEl,
      proxySubpath,
      productId,
      buttonLabel,
      addedLabel,
    );
  });

  async function refreshWishlistState(
    button,
    messageEl,
    proxySubpath,
    productId,
    buttonLabel,
    addedLabel,
  ) {
    try {
      const response = await fetch(
        `/apps/${proxySubpath}/wishlist?product_id=${encodeURIComponent(productId)}`,
        {
          headers: { Accept: "application/json" },
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load wishlist status.");
      }

      setAddedState(button, Boolean(result.inWishlist), buttonLabel, addedLabel);
      button.disabled = Boolean(result.inWishlist);
    } catch (error) {
      showMessage(
        messageEl,
        error instanceof Error ? error.message : "Could not load wishlist status.",
        true,
      );
    }
  }

  function setAddedState(button, isAdded, buttonLabel, addedLabel) {
    button.classList.toggle("is-added", isAdded);
    button.textContent = isAdded ? addedLabel : buttonLabel;
  }

  function showMessage(element, text, isError) {
    if (!element) {
      return;
    }

    element.hidden = false;
    element.textContent = text;
    element.classList.toggle("is-error", isError);
  }

  function clearMessage(element) {
    if (!element) {
      return;
    }

    element.hidden = true;
    element.textContent = "";
    element.classList.remove("is-error");
  }
})();
