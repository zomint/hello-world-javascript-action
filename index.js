const core = require('@actions/core');
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
  const octokit = new Octokit({
    auth: core.getInput('github_token', { required: true })
  })

  try {
    const { data: response_data } = await octokit.request(`GET /repos/${owner}/${repo}/releases/tags/${core.getInput('tag_name', { required: true })}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      tag: `${core.getInput('tag_name', { required: true })}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    id = response_data.id;
    console.log(`getRelease id: ${id}`)
    return id;
  } catch (error) {
  }
}

async function createRelease() {
  console.log('createRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const octokit = new Octokit({
    auth: core.getInput('github_token', { required: true })
  })

  const { data: response_data } = await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
    owner: `${owner}`,
    repo: `${repo}`,
    tag_name: core.getInput('tag_name', { required: true }) || undefined,
    target_commitish: core.getInput('target_commitish') || undefined,
    name: core.getInput('name') || undefined,
    body: core.getInput('body') || undefined,
    draft: core.getBooleanInput('draft'),
    prerelease: core.getBooleanInput('prerelease'),
    discussion_category_name: core.getInput('discussion_category_name') || undefined,
    generate_release_notes: core.getBooleanInput('generate_release_notes'),
    make_latest: core.getInput('make_latest') || undefined,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(`createRelease data: ${JSON.stringify(response_data, undefined, 2)}`)
}

async function deleteRelease(release_id) {
  if (!release_id) {
    return;
  }
  console.log(`deleteRelease: ${release_id}`)
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const octokit = new Octokit({
    auth: core.getInput('github_token', { required: true })
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
    auth: core.getInput('github_token', { required: true })
  })

  tag = core.getInput('tag_name', { required: true })

  try {
    await octokit.request(`PATCH /repos/${owner}/${repo}/git/refs/tags/${core.getInput('tag_name', { required: true })}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      ref: `tags/${core.getInput('tag_name', { required: true })}`,
      sha: core.getInput('target_commitish') || process.env.GITHUB_SHA,
      force: true,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  } catch (error) {
  }
}

async function autoRelease() {
  if (core.getBooleanInput('force')) {
    release_id = await getRelease();
    if (release_id != null) {
      await deleteRelease(release_id)
    }

    await updateTag();
  }

  await createRelease();
}

try {
  autoRelease();
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}