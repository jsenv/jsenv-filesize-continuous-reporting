import { renderDirectoryImpact } from "./renderDirectoryImpact.js"
import { renderFilesImpact } from "./renderFilesImpact.js"
import { renderCacheImpact } from "./renderCacheImpact.js"

export const generatePullRequestCommentString = ({
  pullRequestBase,
  pullRequestHead,
  snapshotComparison,
  formatSize,
  commentSections,
  generatedByLink,
}) => {
  const directoryMessages = Object.keys(snapshotComparison).map((directoryRelativeUrl) => {
    const directoryComparison = snapshotComparison[directoryRelativeUrl]

    return `<details>
  <summary>${generateSummary(directoryRelativeUrl)}</summary>
${generateDetails(directoryComparison, {
  directoryRelativeUrl,
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

  if (directoryMessages.length === 0) return null

  return `<!-- Generated by @jsenv/github-pull-request-filesize-impact -->
${directoryMessages.join(`

`)}${generatedByLink ? renderGeneratedByLink() : ""}`
}

const generateSummary = (directoryRelativeUrl) => directoryRelativeUrl

const COMMENT_NAME_TO_RENDER = {
  directoryImpact: renderDirectoryImpact,
  filesImpact: renderFilesImpact,
  cacheImpact: renderCacheImpact,
}

const generateDetails = (
  directoryComparison,
  { directoryRelativeUrl, pullRequestBase, pullRequestHead, commentSections, formatSize },
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
      return renderCommentSection(directoryComparison, {
        directoryRelativeUrl,
        pullRequestBase,
        pullRequestHead,
        formatSize,
      })
    })
    .join("")
}

const renderGeneratedByLink = () => {
  return `

<sub>
  Generated by <a href="https://github.com/jsenv/jsenv-github-pull-request-filesize-impact">github pull request filesize impact</a>
</sub>`
}
