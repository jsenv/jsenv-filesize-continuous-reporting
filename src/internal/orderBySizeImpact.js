export const orderBySizeImpact = (fileByFileImpact, sizeNames) => {
  const impactOrderedBySizeImpact = {}
  const files = Object.keys(fileByFileImpact)
  const lastSizeName = sizeNames[sizeNames.length - 1]
  files.sort((leftFile, rightFile) => {
    const leftFileSizeImpact = sizeImpactFromFileImpact(fileByFileImpact[leftFile], lastSizeName)
    const rightFileSizeImpact = sizeImpactFromFileImpact(fileByFileImpact[rightFile], lastSizeName)
    if (leftFileSizeImpact === 0) {
      return 1
    }
    if (rightFileSizeImpact === 0) {
      return -1
    }
    if (leftFileSizeImpact < rightFileSizeImpact) {
      return 1
    }
    if (leftFileSizeImpact > rightFileSizeImpact) {
      return -1
    }
    return 0
  })
  files.forEach((file) => {
    impactOrderedBySizeImpact[file] = fileByFileImpact[file]
  })
  return impactOrderedBySizeImpact
}

const sizeImpactFromFileImpact = (fileImpact, sizeName) => {
  const { sizeMapBeforeMerge, sizeMapAfterMerge } = fileImpact
  const sizeBeforeMerge = sizeMapBeforeMerge[sizeName]
  const sizeAfterMerge = sizeMapAfterMerge[sizeName]
  if (sizeBeforeMerge === undefined) {
    return sizeAfterMerge
  }
  if (sizeAfterMerge === undefined) {
    return -sizeBeforeMerge
  }
  return sizeAfterMerge - sizeBeforeMerge
}
