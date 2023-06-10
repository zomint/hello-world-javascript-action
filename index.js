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

try {
  GetBranches();
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}