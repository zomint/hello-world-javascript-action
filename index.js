const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/action");

console.log(process.env.GITHUB_REPOSITORY)

async function getBranches() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  const { data: response_data } = await octokit.request(`GET /repos/${owner}/${repo}/branches`, {
    owner: `${owner}`,
    repo: `${repo}`,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(`response_data: ${response_data}`)
  console.log(`getBranches response data: ${JSON.stringify(response_data, undefined, 2)}`)
}

async function getRelease(tag) {
  console.log('getRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

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

async function createRelease(tag) {
  console.log('createRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  const { data: response_data } = await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
    owner: `${owner}`,
    repo: `${repo}`,
    tag_name: `${tag}`,
    target_commitish: 'main',
    name: `${tag}`,
    body: '',
    draft: false,
    prerelease: false,
    generate_release_notes: false,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(`createRelease data: ${JSON.stringify(response_data, undefined, 2)}`)
}

async function listRelease() {
  console.log('listRelease')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  const { data } = await octokit.request(`GET /repos/${owner}/${repo}/releases`, {
    owner: `${owner}`,
    repo: `${repo}`,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  console.log(`listRelease data: ${JSON.stringify(data, undefined, 2)}`)
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
    auth: process.env.GITHUB_TOKEN
  })
  try {
    await octokit.request(`DELETE /repos/${owner}/${repo}/releases/${release_id}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      release_id: `${release_id}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
  } catch (error) {
    console.log(`error: ${error.message}`);
  }
}

async function deleteReference(reference) {
  console.log('deleteReference')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  try {
    const { status } = await octokit.request(`DELETE /repos/${owner}/${repo}/git/refs/${reference}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      ref: `${reference}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    console.log(`deleteReference status: ${status}`)
  } catch (error) {

  }
}

async function updateTag(tag) {
  console.log('updateTag')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  try {
    await octokit.request(`PATCH /repos/${owner}/${repo}/git/refs/tags/${tag}`, {
      owner: `${owner}`,
      repo: `${repo}`,
      ref: `tags/${tag}`,
      sha: process.env.GITHUB_SHA,
      force: true,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  } catch (error) {

  }
}

async function autoRelease(tag) {
  release_id = await getRelease(tag);
  if (release_id != null) {
    await deleteRelease(release_id)
  }

  updateTag(tag);
  await createRelease(tag);
}

try {
  const tag = core.getInput('tag');
  console.log(`tag: ${tag}`)
  if (tag == '' || tag == null) {
    core.setFailed("invalid tag");
    console.log("invalid tag");
    return
  }
  autoRelease(tag);
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}