const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/action");

function stringToBool(string) {
  if (string === 'true') {
    return true;
  } else if (string === 'false') {
    return false;
  } else {
    return undefined;
  }
}

async function getRelease() {
  console.log('getRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.INPUT_GITHUB_TOKEN
  })

  tag = process.env.INPUT_TAG_NAME

  try {
    const { data: response_data } = await octokit.request(`GET /repos/${owner}/${repo}/releases/tags/${tag}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      tag: `${tag}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    id = response_data.id;
    console.log(`getRelease id: ${id}`)
    // console.log(`getRelease data: ${JSON.stringify(response_data, undefined, 2)}`)
    return id;
  } catch (error) {
    return null
  }
}

async function createRelease() {
  console.log('createRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.INPUT_GITHUB_TOKEN
  })

  console.log(`process.env.INPUT_NAME: ${process.env.INPUT_NAME}`);
  console.log(`process.env.INPUT_DISCUSSION_CATEGORY_NAME: ${process.env.INPUT_DISCUSSION_CATEGORY_NAME}`);
  const { data: response_data } = await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
    owner: `${owner}`,
    repo: `${repo}`,
    tag_name: process.env.INPUT_TAG_NAME || undefined,
    target_commitish: process.env.INPUT_TARGET_COMMITISH || undefined,
    name: process.env.INPUT_NAME || undefined,
    body: process.env.INPUT_BODY || undefined,
    draft: stringToBool(process.env.INPUT_DRAFT),
    prerelease: stringToBool(process.env.INPUT_PRERELEASE),
    discussion_category_name: process.env.INPUT_DISCUSSION_CATEGORY_NAME || undefined,
    generate_release_notes: stringToBool(process.env.INPUT_GENERATE_RELEASE_NOTES),
    make_latest: process.env.INPUT_MAKE_LATEST || undefined,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(`createRelease data: ${JSON.stringify(response_data, undefined, 2)}`)
}

async function deleteRelease(release_id) {
  if (release_id == null) {
    return null;
  }
  console.log(`deleteRelease: ${release_id}`)
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.INPUT_GITHUB_TOKEN
  })

  await octokit.request(`DELETE /repos/${owner}/${repo}/releases/${release_id}`, {
    owner: `${owner}`,
    repo: `${repo}`,
    release_id: `${release_id}`,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

async function updateTag() {
  console.log('updateTag')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.INPUT_GITHUB_TOKEN
  })

  tag = process.env.INPUT_TAG_NAME

  try {
    await octokit.request(`PATCH /repos/${owner}/${repo}/git/refs/tags/${tag}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      ref: `tags/${tag}`,
      sha: process.env.INPUT_TARGET_COMMITISH,
      force: true,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  } catch (error) {

  }
}

async function autoRelease() {
  release_id = await getRelease();
  if (release_id != null) {
    await deleteRelease(release_id)
  }

  updateTag();
  await createRelease();
}

try {
  console.log(process.env.INPUT_TAG_NAME)
  // console.log(process.env.INPUT_GITHUB_TOKEN)

  if (process.env.INPUT_TAG_NAME == undefined) {
    throw new Error("undefined tag name");
  }

  if (process.env.INPUT_GITHUB_TOKEN == undefined) {
    throw new Error("undefined github token");
  }

  autoRelease();
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}