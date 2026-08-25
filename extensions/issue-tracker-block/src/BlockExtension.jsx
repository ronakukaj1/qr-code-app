import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { getIssues, getVariantsCount, updateIssues } from "./utils.js";

const PAGE_SIZE = 3;
const ACTION_HANDLE = "issue-tracker-action";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, navigation, i18n } = shopify;
  const [loading, setLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const [issues, setIssues] = useState(
    /** @type {Array<{ id: number; title: string; description: string; completed: boolean }>} */ ([]),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const productId = data.selected[0]?.id;
  const issuesCount = issues.length;
  const totalPages = Math.ceil(issuesCount / PAGE_SIZE);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const [loadedIssues, variantCount] = await Promise.all([
          getIssues(productId),
          getVariantsCount(productId),
        ]);

        setIssues(loadedIssues);
        setShouldRender(variantCount > 1);
      } catch (error) {
        console.error("[issue-tracker-block] Failed to load issues:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const paginatedIssues = useMemo(() => {
    if (issuesCount <= PAGE_SIZE) {
      return issues;
    }

    return issues.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [issuesCount, issues, currentPage]);

  /** @param {number} id @param {string} value */
  function handleChange(id, value) {
    setIssues((currentIssues) => {
      const newIssues = [...currentIssues];
      const editingIssueIndex = newIssues.findIndex(
        (listIssue) => listIssue.id == id,
      );

      if (editingIssueIndex === -1) {
        return currentIssues;
      }

      newIssues[editingIssueIndex] = {
        ...newIssues[editingIssueIndex],
        completed: value === "completed",
      };

      return newIssues;
    });
  }

  /** @param {number} id */
  async function handleDelete(id) {
    const newIssues = issues.filter((issue) => issue.id !== id);
    setIssues(newIssues);

    if (productId) {
      await updateIssues(productId, newIssues);
    }

    if (currentPage > 1 && (currentPage - 1) * PAGE_SIZE >= newIssues.length) {
      setCurrentPage(currentPage - 1);
    }
  }

  /** @param {any} event */
  function onSubmit(event) {
    if (!productId) {
      return;
    }

    event.waitUntil(updateIssues(productId, issues));
  }

  function onReset() {}

  function openCreateAction() {
    navigation?.navigate(`extension:${ACTION_HANDLE}`);
  }

  /** @param {number} id */
  function openEditAction(id) {
    navigation?.navigate(`extension:${ACTION_HANDLE}?issueId=${id}`);
  }

  const blockMarkup = loading ? (
    <s-stack direction="inline">
      <s-spinner accessibilityLabel={i18n.translate("name")} />
    </s-stack>
  ) : (
    <s-form id="issues-form" onSubmit={onSubmit} onReset={onReset}>
      <s-stack direction="block" gap="base">
        {issuesCount ? (
          <s-table
            paginate
            id="issues-table"
            onNextPage={() => setCurrentPage((page) => page + 1)}
            onPreviousPage={() => setCurrentPage((page) => page - 1)}
            hasNextPage={currentPage < totalPages}
            hasPreviousPage={currentPage > 1}
          >
            <s-table-header-row>
              <s-table-header listSlot="primary">
                {i18n.translate("issue-column-heading")}
              </s-table-header>
              <s-table-header>
                {i18n.translate("status-column-heading")}
              </s-table-header>
              <s-table-header />
              <s-table-header />
            </s-table-header-row>
            <s-table-body>
              {paginatedIssues.map(({ id, title, description, completed }) => (
                <s-table-row key={id}>
                  <s-table-cell>
                    <s-stack direction="block" gap="small">
                      <s-text type="strong">{title}</s-text>
                      <s-text color="subdued">{description}</s-text>
                    </s-stack>
                  </s-table-cell>
                  <s-table-cell>
                    <s-select
                      labelAccessibilityVisibility="exclusive"
                      label={i18n.translate("select-label")}
                      value={completed ? "completed" : "todo"}
                      onChange={(event) => {
                        handleChange(
                          id,
                          /** @type {any} */ (event.currentTarget).value ?? "todo",
                        );
                      }}
                    >
                      <s-option value="todo" selected={!completed}>
                        {i18n.translate("option-todo")}
                      </s-option>
                      <s-option value="completed" selected={completed}>
                        {i18n.translate("option-completed")}
                      </s-option>
                    </s-select>
                  </s-table-cell>
                  <s-table-cell>
                    <s-button
                      variant="tertiary"
                      icon="edit"
                      accessibilityLabel={i18n.translate("edit-issue-button")}
                      onClick={() => openEditAction(id)}
                    />
                  </s-table-cell>
                  <s-table-cell>
                    <s-button
                      variant="tertiary"
                      icon="delete"
                      accessibilityLabel={i18n.translate("delete-issue-button")}
                      onClick={() => handleDelete(id)}
                    />
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-text color="subdued">{i18n.translate("no-issues-text")}</s-text>
        )}

        <s-button onClick={openCreateAction}>
          {issuesCount
            ? i18n.translate("add-issue-button")
            : i18n.translate("add-first-issue-button")}
        </s-button>
      </s-stack>
    </s-form>
  );

  return (
    <s-admin-block
      heading={i18n.translate("name")}
      collapsedSummary={
        !shouldRender ? i18n.translate("collapsed-summary") : undefined
      }
    >
      {shouldRender ? blockMarkup : null}
    </s-admin-block>
  );
}
