import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useState} from "preact/hooks";

const INITIAL_DOCUMENTS = [
  {
    id: "invoice",
    label: "Receipt / Invoice",
    subtitle: "Print a detailed sales receipt with tax and payment information",
    selected: true,
  },
  {
    id: "packing-slip",
    label: "Packing Slip",
    subtitle: "Print shipping details and item list for order fulfillment",
    selected: false,
  },
  {
    id: "returns-form",
    label: "Returns Form",
    subtitle: "Print return authorization form with shipping labels",
    selected: false,
  },
  {
    id: "draft-orders-quote",
    label: "Draft Orders Quote",
    subtitle: "Print price quotes and custom order details for customers",
    selected: false,
  },
  {
    id: "refund-credit-note",
    label: "Refund / Credit Note",
    subtitle: "Print refund documentation with returned items and amounts",
    selected: false,
  },
];

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);

  const url = navigation.currentEntry.url;
  /** @type {{ selectedIds?: string[] } | undefined} */
  const state = navigation.currentEntry.getState();

  /** @param {any} event */
  const handleSelectionChange = (event) => {
    const selectedIds = /** @type {any} */ (event.currentTarget).values ?? [];
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => ({
        ...doc,
        selected: selectedIds.includes(doc.id),
      })),
    );
  };

  const handleNext = () => {
    const selectedDocs = documents.filter((doc) => doc.selected);
    if (!selectedDocs.length) {
      return;
    }

    const selectedIds = selectedDocs.map((doc) => doc.id);
    navigation.navigate("preview", {
      state: {selectedIds},
    });
  };

  const handlePrint = async () => {
    const selectedIds = state?.selectedIds;
    if (!selectedIds?.length) {
      return;
    }

    const params = new URLSearchParams({
      printTypes: selectedIds.join(","),
    });
    const src = `/print?${params.toString()}`;

    setIsLoading(true);
    try {
      await shopify.print.print(src);
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (url?.includes("preview")) {
    const selectedIds = state?.selectedIds ?? [];
    const params = new URLSearchParams({
      printTypes: selectedIds.join(","),
    });
    const src = `/print?${params.toString()}`;

    return (
      <s-page heading="Print Tutorial">
        {src ? (
          <s-box padding="base">
            <s-text>Print preview URL: {src}</s-text>
          </s-box>
        ) : null}
        <s-stack direction="block" gap="small" padding="small">
          <s-button
            disabled={isLoading || !selectedIds.length}
            loading={isLoading}
            onClick={handlePrint}
            variant="primary"
          >
            Print
          </s-button>
          <s-button onClick={() => navigation.back()} variant="secondary">
            Back
          </s-button>
        </s-stack>
      </s-page>
    );
  }

  return (
    <s-page heading="Print Tutorial">
      <s-scroll-box padding="base">
        <s-section heading="Templates">
          <s-choice-list
            multiple
            values={documents.filter((doc) => doc.selected).map((doc) => doc.id)}
            onChange={handleSelectionChange}
          >
            {documents.map((doc) => (
              <s-choice key={doc.id} value={doc.id}>
                <s-stack direction="block" gap="small">
                  <s-heading>{doc.label}</s-heading>
                  <s-text>{doc.subtitle}</s-text>
                </s-stack>
              </s-choice>
            ))}
          </s-choice-list>
        </s-section>
      </s-scroll-box>
      <s-stack direction="inline" gap="small" padding="small">
        <s-button
          disabled={!documents.some((doc) => doc.selected)}
          onClick={handleNext}
          variant="primary"
        >
          Next
        </s-button>
      </s-stack>
    </s-page>
  );
}
