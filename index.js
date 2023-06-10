const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/action");

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}

async function GetBranches() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  await octokit.request(`GET /repos/${owner}/${repo}/branches`, {
    owner: `${owner}`,
    repo: `${repo}`,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function createTag() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  await octokit.request(`POST /repos/${owner}/${repo}/git/tags`, {
    owner: `${owner}`,
    repo: `${repo}`,
    tag: 'v0.0.1',
    message: 'initial version',
    object: process.env.GITHUB_TOKEN.GITHUB_SHA,
    type: 'commit',
    tagger: {
      name: 'Monalisa Octocat',
      email: 'octocat@github.com',
      date: '2011-06-17T14:53:35-07:00'
    },
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function createRelease() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  console.log(`owner: ${owner}`);
  console.log(`repo: ${repo}`);
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })
  await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
    owner: `${owner}`,
    repo: `${repo}`,
    tag_name: 'v1.0.0',
    target_commitish: 'main',
    name: 'v1.0.0',
    body: 'Description of the release',
    draft: false,
    prerelease: false,
    generate_release_notes: false,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

try {
  GetBranches();
  createRelease();
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}