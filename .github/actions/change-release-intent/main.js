const { exec } = require('@actions/exec');
const { getPackages } = require('@manypkg/get-packages');

async function execWithOutput(command, args, options) {
  let myOutput = '';
  let myError = '';

  return {
    code: await exec(command, args, {
      listeners: {
        stdout: (data) => {
          myOutput += data.toString();
        },
        stderr: (data) => {
          myError += data.toString();
        },
      },

      ...options,
    }),
    stdout: myOutput,
    stderr: myError,
  };
}

const publishablePackages = [
  'harmonious-utils',
  'harmonious-scale',
  'harmonious-rhythm',
  'harmonious-type',
  'harmonious-themes',
  'harmonious-react',
];

(async () => {
  const currentBranchName = (
    await execWithOutput('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  ).stdout.trim();

  if (!/^changeset-release\//.test(currentBranchName)) {
    return;
  }

  const latestCommitMessage = (
    await execWithOutput('git', ['log', '-1', '--pretty=%B'])
  ).stdout.trim();

  await exec('git', ['reset', '--mixed', 'HEAD~1']);

  const { packages } = await getPackages(process.cwd());

  for (let workspace of packages) {
    if (publishablePackages.includes(workspace.packageJson.name)) {
      continue;
    }
    await exec('git', ['checkout', '--', workspace.dir]);
  }

  await exec('git', ['add', '.']);
  await exec('git', ['commit', '-m', latestCommitMessage]);
  await exec('git', ['push', 'origin', currentBranchName, '--force']);
})();
