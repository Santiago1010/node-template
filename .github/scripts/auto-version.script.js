// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * Auto-versioning script for GitHub Actions
 * Updates package.json version and CHANGELOG.md based on PR labels and content
 * OPTIMIZED: Fetches large data via GitHub API instead of environment variables
 */
class AutoVersioning {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPOSITORY;
    this.prNumber = process.env.PR_NUMBER;
    this.prTitle = process.env.PR_TITLE;
    this.prBody = process.env.PR_BODY || '';
    this.prLabels = JSON.parse(process.env.PR_LABELS || '[]');
    this.prAuthor = process.env.PR_AUTHOR || '';
    this.prApprover = process.env.PR_APPROVER || '';
    this.prMilestone = process.env.PR_MILESTONE || '';

    // These will be fetched via API
    this.prCommits = [];
    this.prProjects = [];

    this.packagePath = path.join(process.cwd(), 'package.json');
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

    this.validateEnvironment();
  }

  /**
   * Makes GitHub API requests
   */
  async githubApiRequest(endpoint) {
    const [owner, repo] = this.repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}${endpoint}`;

    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          Authorization: `token ${this.token}`,
          'User-Agent': 'GitHub-Actions-Auto-Version',
          Accept: 'application/vnd.github.v3+json',
        },
      };

      const req = https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          } else {
            reject(new Error(`API request failed: ${res.statusCode} ${res.statusMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Fetches PR commits from GitHub API
   */
  async fetchPrCommits() {
    try {
      console.log('📡 Fetching PR commits from API...');
      const commits = await this.githubApiRequest(`/pulls/${this.prNumber}/commits`);
      this.prCommits = commits.slice(-10); // Limit to last 10 commits
      console.log(`✅ Fetched ${this.prCommits.length} commits`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch commits: ${error.message}`);
      this.prCommits = [];
    }
  }

  /**
   * Fetches repository projects from GitHub API
   */
  async fetchRepoProjects() {
    try {
      console.log('📡 Fetching repository projects from API...');
      const projects = await this.githubApiRequest('/projects');
      this.prProjects = projects.map((p) => p.name);
      console.log(`✅ Fetched ${this.prProjects.length} projects`);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch projects: ${error.message}`);
      this.prProjects = [];
    }
  }

  formatDate(format = 'YYYY-MM-DD') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY-MM-DD HH:mm:ss UTC':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  validateEnvironment() {
    const required = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'PR_NUMBER', 'PR_TITLE'];
    const missing = required.filter((env) => !process.env[env]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!fs.existsSync(this.packagePath)) {
      throw new Error('package.json not found in current directory');
    }
  }

  /**
   * Determines version bump type from PR labels
   * Priority: major > minor > patch (default)
   */
  determineVersionBump() {
    const labelNames = this.prLabels.map((label) => label.name.toLowerCase());

    const versionPatterns = {
      major: ['major', 'version:major', 'breaking', 'breaking-change'],
      minor: ['minor', 'version:minor', 'feature', 'feat', 'enhancement'],
      patch: ['patch', 'version:patch', 'fix', 'bugfix', 'hotfix'],
    };

    if (versionPatterns.major.some((pattern) => labelNames.includes(pattern))) {
      return 'major';
    }

    if (versionPatterns.minor.some((pattern) => labelNames.includes(pattern))) {
      return 'minor';
    }

    return 'patch';
  }

  /**
   * Updates package.json version based on semver bump type
   */
  updatePackageVersion(bumpType) {
    const pkg = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    const currentVersion = pkg.version;

    if (!currentVersion) {
      throw new Error('No version found in package.json');
    }

    const [major, minor, patch] = currentVersion.split('.').map(Number);

    if ([major, minor, patch].some((num) => isNaN(num))) {
      throw new Error(`Invalid version format in package.json: ${currentVersion}`);
    }

    let newVersion;
    switch (bumpType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    pkg.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(pkg, null, 2) + '\n');

    return { currentVersion, newVersion };
  }

  /**
   * Maps PR labels to changelog type checkboxes
   */
  mapLabelsToTypeOfChange() {
    const labelNames = this.prLabels.map((label) => label.name.toLowerCase());

    return {
      new_feature: labelNames.some((l) => ['feat', 'feature', 'type:feature', 'enhancement'].includes(l)),
      bug_fix: labelNames.some((l) => ['fix', 'bug', 'patch', 'bugfix'].includes(l)),
      breaking_change: labelNames.some((l) => ['breaking', 'major', 'breaking-change'].includes(l)),
      documentation: labelNames.some((l) => ['docs', 'documentation', 'readme'].includes(l)),
      refactoring: labelNames.some((l) => ['refactor', 'refactoring', 'cleanup'].includes(l)),
      performance: labelNames.some((l) => ['perf', 'performance', 'optimization'].includes(l)),
      testing: labelNames.some((l) => ['test', 'tests', 'testing', 'coverage'].includes(l)),
      build_system: labelNames.some((l) => ['build', 'deps', 'dependencies'].includes(l)),
      ci_cd: labelNames.some((l) => ['ci', 'cd', 'workflow', 'actions', 'chore'].includes(l)),
    };
  }

  /**
   * Formats commits list for changelog
   */
  formatCommitsForChangelog() {
    if (!this.prCommits || this.prCommits.length === 0) {
      return [];
    }

    const repoUrl = `https://github.com/${this.repo}`;

    return this.prCommits
      .filter((commit) => commit.commit && commit.sha)
      .map((commit) => {
        const shortSha = commit.sha.substring(0, 7);
        const message = commit.commit.message.split('\n')[0];
        const commitUrl = `${repoUrl}/commit/${commit.sha}`;
        return { shortSha, message, url: commitUrl };
      });
  }

  /**
   * Truncate text to prevent excessive length
   */
  truncateText(text, maxLength = 1000) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '\n\n... (content truncated)';
  }

  /**
   * Generates a changelog entry WITHOUT formatting or parsing PR content.
   * It copies the PR title and PR body verbatim into the changelog.
   */
  generateChangelogEntry(version) {
    console.log('📝 Generating changelog entry (raw PR content)...');

    const date = this.formatDate('YYYY-MM-DD');
    const datetime = this.formatDate('YYYY-MM-DD HH:mm:ss UTC');
    const repoUrl = `https://github.com/${this.repo}`;
    const prUrl = `${repoUrl}/pull/${this.prNumber}`;

    // RAW: no trimming, no markdown removal, no parsing - but truncate if too long
    const rawTitle = this.prTitle || '';
    const rawBody = this.truncateText(this.prBody === undefined || this.prBody === null ? '' : this.prBody);

    // Type mapping (kept for metadata, not used to modify content)
    const typeMapping = this.mapLabelsToTypeOfChange();
    const checkedTypes = Object.entries(typeMapping)
      .filter(([_, checked]) => checked)
      .map(([type, _]) => type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

    const commits = this.formatCommitsForChangelog();
    const labelsList = this.prLabels.map((l) => l.name).join(', ') || 'none';

    // Build changelog entry - verbatim PR content
    let changelogEntry = `## [${version}] - ${date}\n\n`;
    changelogEntry += `**Released:** ${datetime}\n\n`;
    changelogEntry += `### [${rawTitle || '(no title)'}](${prUrl})\n\n`;

    // Insert PR Body verbatim. If empty, mark as (no body).
    changelogEntry += `**PR Content (verbatim):**\n`;
    if (rawBody && rawBody.length > 0) {
      changelogEntry += `${rawBody}\n\n`;
    } else {
      changelogEntry += `(no body)\n\n`;
    }

    // Include labels and type of change metadata
    if (checkedTypes.length > 0) {
      changelogEntry += `**Type of Change:** ${checkedTypes.join(', ')}\n\n`;
    }

    // Metadata
    changelogEntry += `**Details:**\n`;
    changelogEntry += `- Author: [@${this.prAuthor}](https://github.com/${this.prAuthor})\n`;
    if (this.prApprover) {
      changelogEntry += `- Approved by: [@${this.prApprover}](https://github.com/${this.prApprover})\n`;
    }
    changelogEntry += `- Labels: ${labelsList}\n`;
    if (this.prMilestone) {
      changelogEntry += `- Milestone: ${this.prMilestone}\n`;
    }
    changelogEntry += `- Commits: ${commits.length}\n\n`;

    // Commits (show only the most relevant)
    if (commits.length > 0) {
      changelogEntry += `**Commits:**\n`;
      commits.forEach((commit) => {
        changelogEntry += `- [\`${commit.shortSha}\`](${commit.url}) ${commit.message}\n`;
      });
      changelogEntry += `\n`;
    }

    changelogEntry += `---\n\n`;

    console.log('✅ Changelog entry generated (raw)');
    return changelogEntry;
  }

  /**
   * Updates CHANGELOG.md with new version entry
   */
  updateChangelog(version) {
    console.log('📝 Starting changelog update...');

    const changelogEntry = this.generateChangelogEntry(version);

    console.log('📂 Reading existing changelog...');
    // Read or create CHANGELOG.md
    let existingContent = '';
    if (fs.existsSync(this.changelogPath)) {
      existingContent = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      existingContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n---\n\n`;
    }

    console.log('🔍 Checking for existing version...');
    // Check if this version already exists
    const versionHeaderRegex = new RegExp(`^## \\[${version.replace(/\\./g, '\\\\.')}\\]`, 'm');

    if (versionHeaderRegex.test(existingContent)) {
      console.log(`🔄 Version ${version} already exists, replacing...`);
      // Version already exists, replace the entire section
      const lines = existingContent.split('\n');
      const versionLineIndex = lines.findIndex((line) => versionHeaderRegex.test(line));

      // Find end of this section (next version or end of file)
      let endIndex = lines.length;
      for (let i = versionLineIndex + 1; i < lines.length; i++) {
        if (lines[i].match(/^## \[/)) {
          endIndex = i;
          break;
        }
      }

      // Replace section
      const beforeVersion = lines.slice(0, versionLineIndex).join('\n');
      const afterVersion = lines.slice(endIndex).join('\n');

      let separator = beforeVersion.length > 0 ? '\n' : '';
      existingContent = beforeVersion + separator + changelogEntry + afterVersion;
    } else {
      console.log(`➕ Adding new version ${version}...`);
      // New version, insert at beginning of content (after header)
      const headerMatch = existingContent.match(/(^# Changelog[\s\S]*?---\n\n)/);
      if (headerMatch) {
        const header = headerMatch[1];
        const content = existingContent.substring(header.length);
        existingContent = header + changelogEntry + content;
      } else {
        // Fallback: add after first line
        const lines = existingContent.split('\n');
        lines.splice(1, 0, '', changelogEntry);
        existingContent = lines.join('\n');
      }
    }

    console.log('💾 Writing changelog file...');
    // Write updated changelog
    fs.writeFileSync(this.changelogPath, existingContent);

    console.log(`📝 Changelog entry created for version ${version}`);
    console.log(`📅 Date: ${this.formatDate('YYYY-MM-DD')}`);
    console.log(`👤 Author: ${this.prAuthor || 'Unknown'}`);
    console.log(`📎 Commits: ${this.prCommits.length}`);
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log(`🚀 Starting auto-versioning for PR #${this.prNumber}`);
      console.log(`📝 PR Title: ${this.prTitle}`);
      console.log(`🏷️  PR Labels: ${this.prLabels.map((l) => l.name).join(', ') || 'none'}`);

      // Fetch additional data from API
      await this.fetchPrCommits();
      await this.fetchRepoProjects();

      const bumpType = this.determineVersionBump();
      console.log(`📈 Version bump type: ${bumpType}`);

      const { currentVersion, newVersion } = this.updatePackageVersion(bumpType);
      console.log(`📦 Version updated: ${currentVersion} → ${newVersion}`);

      this.updateChangelog(newVersion);
      console.log(`📋 Changelog updated with version ${newVersion}`);

      // Output for GitHub Actions
      console.log(`::set-output name=version::${newVersion}`);
      console.log(`::set-output name=bump_type::${bumpType}`);

      console.log('✅ Auto-versioning completed successfully');

      return {
        success: true,
        version: newVersion,
        bumpType,
        previousVersion: currentVersion,
      };
    } catch (error) {
      console.error('❌ Auto-versioning failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Execute only if run directly (not when imported)
if (require.main === module) {
  const autoVersioning = new AutoVersioning();
  autoVersioning.run();
}

module.exports = AutoVersioning;
