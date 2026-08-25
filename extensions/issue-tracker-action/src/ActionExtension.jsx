import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { getIssues, updateIssues } from "./utils.js";

/**
 * @typedef {{ id: number; title: string; description: string; completed: boolean }} Issue
 * @typedef {{ title: string; description: string; id?: number | string | null }} IssueForm
 * @typedef {{ title?: boolean; description?: boolean } | null} FormErrors
 */

/** @param {Issue[]} allIssues */
function generateId(allIssues) {
  return !allIssues?.length ? 0 : allIssues[allIssues.length - 1].id + 1;
}

/** @param {IssueForm} param0 */
function validateForm({ title, description }) {
  return {
    isValid: Boolean(title?.trim()) && Boolean(description?.trim()),
    errors: {
      title: !title?.trim(),
      description: !description?.trim(),
    },
  };
}

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { close, data, intents, i18n } = shopify;
  const issueId = intents?.launchUrl
    ? new URL(intents.launchUrl).searchParams.get("issueId")
    : null;
  const [loading, setLoading] = useState(Boolean(issueId));
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [issue, setIssue] = useState(
    /** @type {IssueForm} */ ({ title: "", description: "", id: issueId }),
  );
  const [allIssues, setAllIssues] = useState(/** @type {Issue[]} */ ([]));
  const [formErrors, setFormErrors] = useState(/** @type {FormErrors} */ (null));
  const { title, description } = issue;
  const isEditing = Boolean(issueId);
  const productId = data.selected[0]?.id;

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    void getIssues(productId).then((issues) => {
      setAllIssues(issues || []);
      setLoading(false);
    });
  }, [productId]);

  useEffect(() => {
    if (!issueId) {
      return;
    }

    const editingIssue = allIssues.find(({ id }) => `${id}` === issueId);

    if (editingIssue) {
      setIssue(editingIssue);
    }
  }, [issueId, allIssues]);

  const getIssueRecommendation = useCallback(async () => {
    if (!productId) {
      return;
    }

    setLoadingRecommended(true);

    const response = await fetch(
      `/api/recommendedProductIssue?productId=${encodeURIComponent(productId)}`,
    );

    setLoadingRecommended(false);

    if (!response.ok) {
      console.error("[issue-tracker-action] Failed to fetch recommendation");
      return;
    }

    const json = await response.json();

    if (json?.productIssue) {
      setIssue((prev) => ({
        ...prev,
        title: json.productIssue.title,
        description: json.productIssue.description,
      }));
    }
  }, [productId]);

  const onSubmit = useCallback(async () => {
    const { isValid, errors } = validateForm(issue);
    setFormErrors(errors);

    if (!isValid || !productId) {
      return;
    }

    const newIssues = [...allIssues];

    if (isEditing) {
      const editingIssueIndex = newIssues.findIndex(
        (listIssue) => listIssue.id == issue.id,
      );

      if (editingIssueIndex === -1) {
        return;
      }

      newIssues[editingIssueIndex] = {
        ...newIssues[editingIssueIndex],
        title: title.trim(),
        description: description.trim(),
      };
    } else {
      newIssues.push({
        id: generateId(allIssues),
        title: title.trim(),
        description: description.trim(),
        completed: false,
      });
    }

    await updateIssues(productId, newIssues);
    close();
  }, [issue, productId, allIssues, close, isEditing, title, description]);

  return (
    <s-admin-action
      heading={
        isEditing
          ? i18n.translate("edit-issue-heading")
          : i18n.translate("create-issue-heading")
      }
      loading={loading}
    >
      <s-stack direction="block" gap="base">
        <s-banner tone="info">
          <s-stack direction="block" gap="base">
            <s-text>{i18n.translate("issue-generate-banner-text")}</s-text>
            <s-stack direction="inline" gap="base">
              <s-button
                disabled={loadingRecommended}
                onClick={getIssueRecommendation}
              >
                {i18n.translate("issue-generate-button")}
              </s-button>
              {loadingRecommended ? (
                <s-spinner
                  accessibilityLabel={i18n.translate("issue-generate-button")}
                />
              ) : null}
            </s-stack>
          </s-stack>
        </s-banner>
        <s-text-field
          value={title}
          error={
            formErrors?.title ? i18n.translate("issue-title-error") : undefined
          }
          onChange={(event) => {
            setIssue((prev) => ({
              ...prev,
              title: event.currentTarget.value ?? "",
            }));
          }}
          label={i18n.translate("issue-title-label")}
          maxLength={50}
        />
        <s-text-area
          value={description}
          error={
            formErrors?.description
              ? i18n.translate("issue-description-error")
              : undefined
          }
          onChange={(event) => {
            setIssue((prev) => ({
              ...prev,
              description: event.currentTarget.value ?? "",
            }));
          }}
          label={i18n.translate("issue-description-label")}
          maxLength={300}
        />
      </s-stack>
      <s-button slot="primary-action" onClick={onSubmit}>
        {isEditing
          ? i18n.translate("issue-save-button")
          : i18n.translate("issue-create-button")}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()}>
        {i18n.translate("issue-cancel-button")}
      </s-button>
    </s-admin-action>
  );
}
