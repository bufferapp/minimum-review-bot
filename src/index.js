// get contents of the PR in context
const getPullRequest = async ({ context }) => {
  const response = await context.github.pullRequests.get({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number:
      context.payload[!!context.payload.issue ? 'issue' : 'pull_request']
        .number,
  })
  return response.data
}

// get the number of reviews in a given state in context
const getReviewsWithState = async ({ context, state }) => {
  const response = await context.github.pullRequests.getReviews({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number:
      context.payload[!!context.payload.issue ? 'issue' : 'pull_request']
        .number,
  })
  return response.data
    .map(review => review.state)
    .filter(word => word.toLowerCase() === state).length
}

// get any comments that contain /skip-reviews
const skipReview = async ({ context }) => {
  const response = await context.github.issues.getComments({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number:
      context.payload[!!context.payload.issue ? 'issue' : 'pull_request']
        .number,
  })
  return (
    response.data.filter(
      comment =>
        comment.body.includes('/skip-review') && comment.user.type !== 'Bot',
    ).length > 0
  )
}

const notReadyMessage = ({ pendingReviewsCount }) =>
  `${pendingReviewsCount} review${
    pendingReviewsCount === 1 ? '' : 's'
  } remaining`

const readyMessage = () => 'ready to merge'

const handleEvent = async context => {
  let config = await context.config('minimum-reviews.yml')
  if (!config) {
    context.log(
      `${context.payload.repository.full_name} missing configuration file`,
    )
    return
  }
  const pullRequest = await getPullRequest({ context })
  const approvals = await getReviewsWithState({ context, state: 'approved' })
  const pendingReviewsCount = Math.max(0, config.reviewsUntilReady - approvals)
  const isSkippingReview = await skipReview({ context })
  const isReadyToMerge = pendingReviewsCount === 0 || isSkippingReview
  const state = isReadyToMerge ? 'success' : 'pending'
  const description = isReadyToMerge
    ? readyMessage()
    : notReadyMessage({ pendingReviewsCount })
  return context.github.repos.createStatus(
    context.repo({
      sha: pullRequest.head.sha,
      state: state,
      description: description,
      context: 'probot/minimum-review-bot',
    }),
  )
}

// Post a comment on the PR when its opened
const handleOpenPullRequest = async context => {
  let config = await context.config('minimum-reviews.yml')
  if (!config) {
    return
  }
  if (config.reviewsUntilReady < 1) {
    return
  }
  const params = context.issue({
    body: `This PR requires ${config.reviewsUntilReady} review${
      config.reviewsUntilReady === 1 ? '' : 's'
    }. Skip the check by commenting /skip-review on this PR.`,
  })

  return context.github.issues.createComment(params)
}

module.exports = robot => {
  robot.on(
    [
      'pull_request.opened',
      'pull_request.reopened',
      'pull_request_review.submitted',
      'pull_request_review.edited',
      'pull_request_review.dismissed',
      'pull_request.synchronize',
      'issue_comment.created',
      'issue_comment.deleted',
    ],
    handleEvent,
  )
  robot.on(['pull_request.opened'], handleOpenPullRequest)
}
