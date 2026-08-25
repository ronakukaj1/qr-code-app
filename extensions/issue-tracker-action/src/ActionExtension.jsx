import { useCallback, useEffect, useState } from "react";
import {
  reactExtension,
  useApi,
  TextField,
  AdminAction,
  Button,
  TextArea,
  Box,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  ProgressIndicator,
} from "@shopify/ui-extensions-react/admin";
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

const TARGET = "admin.product-details.action.render";

export default reactExtension(TARGET, () => <App />);

function App() {
  const { close, data, intents, i18n } = useApi(TARGET);
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
      `api/recommendedProductIssue?productId=${productId}`,
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

  if (loading) {
    return null;
  }

  return (
    <AdminAction
      title={
        isEditing
          ? i18n.translate("edit-issue-heading")
          : i18n.translate("create-issue-heading")
      }
      primaryAction={
        <Button onPress={onSubmit}>
          {isEditing
            ? i18n.translate("issue-save-button")
            : i18n.translate("issue-create-button")}
        </Button>
      }
      secondaryAction={
        <Button onPress={close}>{i18n.translate("issue-cancel-button")}</Button>
      }
    >
      <BlockStack>
        <Banner>
          <BlockStack>
            <Text>{i18n.translate("issue-generate-banner-text")}</Text>
            <InlineStack>
              <Button
                disabled={loadingRecommended}
                onPress={getIssueRecommendation}
              >
                {i18n.translate("issue-generate-button")}
              </Button>
              {loadingRecommended ? (
                <ProgressIndicator size="small-100" />
              ) : null}
            </InlineStack>
          </BlockStack>
        </Banner>
      </BlockStack>
      <TextField
        value={title}
        error={
          formErrors?.title ? i18n.translate("issue-title-error") : undefined
        }
        onChange={(val) => setIssue((prev) => ({ ...prev, title: val }))}
        label={i18n.translate("issue-title-label")}
        maxLength={50}
      />
      <Box paddingBlockStart="large">
        <TextArea
          value={description}
          error={
            formErrors?.description
              ? i18n.translate("issue-description-error")
              : undefined
          }
          onChange={(val) =>
            setIssue((prev) => ({ ...prev, description: val }))
          }
          label={i18n.translate("issue-description-label")}
          maxLength={300}
        />
      </Box>
    </AdminAction>
  );
}
