import { compareTwoSnapshots } from "../compareTwoSnapshots.js"
import { isNew, isDeleted, isChanged } from "./helper.js"
import { renderOverallSizeImpact } from "./renderOverallSizeImpact.js"
import { renderDetailedSizeImpact } from "./renderDetailedSizeImpact.js"
import { renderCacheImpact } from "./renderCacheImpact.js"

export const HEADER = `<!-- Generated by @jsenv/file-size-impact -->
<h4>File size impact</h4>`

export const formatComment = ({
  pullRequestBase,
  pullRequestHead,
  trackingConfig,
  baseSnapshot,
  afterMergeSnapshot,
  formatSize,
  commentSections,
}) => {
  const warnings = []
  const snapshotComparison = compareTwoSnapshots(baseSnapshot, afterMergeSnapshot)
  const groups = Object.keys(snapshotComparison)

  if (groups.length === 0) {
    warnings.push(
      `**Warning:** Nothing is tracked. It happens when tracking config is an empty object.`,
    )
  }

  const bodyParts = [
    renderWarnings(warnings),
    renderBody({
      trackingConfig,
      snapshotComparison,
      pullRequestBase,
      pullRequestHead,
      commentSections,
      formatSize,
    }),
  ].filter((string) => string.length > 0)

  return `${HEADER}

${bodyParts.join(`

`)}`
}

const renderWarnings = (warnings) => {
  if (warnings.length === 0) {
    return ""
  }

  return `---

${warnings.join(`

`)}

---`
}

const renderBody = ({
  trackingConfig,
  snapshotComparison,
  pullRequestBase,
  pullRequestHead,
  commentSections,
  formatSize,
}) => {
  const groupMessages = Object.keys(snapshotComparison).map((groupName) => {
    const groupComparison = snapshotComparison[groupName]
    const emptyGroup = Object.keys(groupComparison).length === 0
    if (emptyGroup) {
      return `<details>
  <summary>${groupName} (no impact)</summary>
  <p>No file matching <code>${groupName}</code> (see <code>${groupName}</code> config below).</p>

\`\`\`json
${JSON.stringify(trackingConfig[groupName], null, "  ")}
\`\`\`

  </details>`
    }

    const fileByFileImpact = groupComparisonToFileByFileImpact(groupComparison)
    const noImpact = Object.keys(fileByFileImpact).length === 0

    if (noImpact) {
      return `<details>
  <summary>${groupName} (no impact)</summary>
  <p>No impact on <code>${groupName}</code> files.</p>
  </details>`
    }

    let overallDiff = 0
    const firstFile = fileByFileImpact[Object.keys(fileByFileImpact)[0]]
    const sizeName = Object.keys((firstFile.base || firstFile.afterMerge).sizeMap)[0]
    Object.keys(fileByFileImpact).forEach((fileRelativeUrl) => {
      const fileImpact = fileByFileImpact[fileRelativeUrl]
      if (fileImpact.event === "created") {
        overallDiff += fileImpact.afterMerge.sizeMap[sizeName]
      } else if (fileImpact.event === "deleted") {
        overallDiff -= fileImpact.base.sizeMap[sizeName]
      } else {
        overallDiff += fileImpact.afterMerge.sizeMap[sizeName] - fileImpact.base.sizeMap[sizeName]
      }
    })
    const overallDiffDisplayed = formatSize(overallDiff, { diff: true, unit: true })

    return `<details>
  <summary>${groupName} (${overallDiffDisplayed})</summary>
${generateDetails(fileByFileImpact, {
  groupName,
  pullRequestBase,
  pullRequestHead,
  commentSections,
  formatSize: (value, ...rest) => {
    // call formatSize only on numbers 'error' must be returned untouched
    if (typeof value === "number") return formatSize(value, ...rest)
    return value
  },
})}
</details>`
  })

  return groupMessages.join(`

`)
}

const groupComparisonToFileByFileImpact = (groupComparison) => {
  const fileByFileImpact = {}
  Object.keys(groupComparison).forEach((fileRelativeUrl) => {
    const { base, afterMerge } = groupComparison[fileRelativeUrl]

    if (isNew({ base, afterMerge })) {
      fileByFileImpact[fileRelativeUrl] = {
        base,
        afterMerge,
        event: "created",
      }
      return
    }

    if (isDeleted({ base, afterMerge })) {
      fileByFileImpact[fileRelativeUrl] = {
        base,
        afterMerge,
        event: "deleted",
      }
      return
    }

    if (isChanged({ base, afterMerge })) {
      fileByFileImpact[fileRelativeUrl] = {
        base,
        afterMerge,
        event: "changed",
      }
    }
  })
  return fileByFileImpact
}

const COMMENT_NAME_TO_RENDER = {
  overallSizeImpact: renderOverallSizeImpact,
  detailedSizeImpact: renderDetailedSizeImpact,
  cacheImpact: renderCacheImpact,
}

const generateDetails = (
  fileByFileImpact,
  { groupName, trackingConfig, pullRequestBase, pullRequestHead, commentSections, formatSize },
) => {
  return Object.keys(commentSections)
    .filter((commentSectionName) => commentSections[commentSectionName])
    .map((commentSectionName) => {
      const renderCommentSection = COMMENT_NAME_TO_RENDER[commentSectionName]
      if (!renderCommentSection) {
        console.warn(
          `unknown comment section ${commentSectionName}. Available comment section are ${Object.keys(
            COMMENT_NAME_TO_RENDER,
          )} `,
        )
        return ""
      }
      return renderCommentSection(fileByFileImpact, {
        groupName,
        trackingConfig,
        pullRequestBase,
        pullRequestHead,
        formatSize,
      })
    }).join(`
`)
}
