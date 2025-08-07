// Using axios instead of @octokit/rest (axios is already in dependencies).

const fs = require('fs');
const path = require('path');
const axios = require('axios');

(async () => {
  // 1. Read environment variables set by GitHub Actions
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo
  const prNumber = process.env.PR_NUMBER; // passed in via workflow

  if (!token || !repo || !prNumber) {
    console.error('Missing GITHUB_TOKEN, GITHUB_REPOSITORY or PR_NUMBER');
    process.exit(1);
  }

  const [owner, repoName] = repo.split('/');
  const prUrl = `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`;

  // 2. Fetch Pull Request data via axios
  const { data: pr } = await axios.get(prUrl, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  // 3. Determine version bump (major/minor/patch) from PR labels
  let bump = 'patch';
  pr.labels.forEach((label) => {
    if (label.name === 'major' || label.name === 'version:major') bump = 'major';
    else if (label.name === 'minor' || label.name === 'version:minor') bump = 'minor';
  });

  // 4. Update package.json version
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const [maj, min, pat] = pkg.version.split('.').map(Number);

  let newVersion;
  switch (bump) {
    case 'major':
      newVersion = `${maj + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${maj}.${min + 1}.0`;
      break;
    default:
      newVersion = `${maj}.${min}.${pat + 1}`;
  }
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 5. Prepend CHANGELOG entry
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG');
  const existingLog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
  const date = new Date().toISOString().split('T')[0];

  const bodyLines = pr.body ? pr.body.split('\n').map((line) => `- ${line}`) : [];

  const entry = `## [${newVersion}] - ${date}
### ${pr.title}
${bodyLines.join('\n')}

`;

  fs.writeFileSync(changelogPath, entry + existingLog);

  console.log(`Released v${newVersion}`);
})().catch((err) => {
  console.error('Release script failed:', err);
  process.exit(1);
});
