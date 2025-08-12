// --------------------------- NODE DEPENDENCIES --------------------------- //
const fs = require('fs');
const path = require('path');

// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const moment = require('moment');

/**
 * Auto-versioning script for GitHub Actions
 * Updates package.json version and CHANGELOG.md based on PR labels and content
 */
class AutoVersioning {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPOSITORY;
    this.prNumber = process.env.PR_NUMBER;
    this.prTitle = process.env.PR_TITLE;
    this.prBody = process.env.PR_BODY || '';
    this.prLabels = JSON.parse(process.env.PR_LABELS || '[]');
    this.prCommits = JSON.parse(process.env.PR_COMMITS || '[]');

    this.packagePath = path.join(process.cwd(), 'package.json');
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

    this.validateEnvironment();
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

    // Define version bump patterns
    const versionPatterns = {
      major: ['major', 'version:major', 'breaking', 'breaking-change'],
      minor: ['minor', 'version:minor', 'feature', 'feat'],
      patch: ['patch', 'version:patch', 'fix', 'bugfix', 'hotfix'],
    };

    // Check for major version first (highest priority)
    if (versionPatterns.major.some((pattern) => labelNames.includes(pattern))) {
      return 'major';
    }

    // Then check for minor version
    if (versionPatterns.minor.some((pattern) => labelNames.includes(pattern))) {
      return 'minor';
    }

    // Default to patch if no specific version labels found
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
   * Formats PR body into changelog entries
   */
  formatChangelogEntries() {
    if (!this.prBody.trim()) {
      return [`- ${this.prTitle}`];
    }

    // Split by lines and filter empty lines
    const lines = this.prBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.startsWith('#')) // Remove markdown headers
      .filter((line) => !line.toLowerCase().includes('closes')) // Remove "Closes #123" lines
      .filter((line) => !line.toLowerCase().includes('fixes')) // Remove "Fixes #123" lines
      .slice(0, 10); // Limit to first 10 lines to avoid overly long changelogs

    if (lines.length === 0) {
      return [`- ${this.prTitle}`];
    }

    // Format each line as a changelog entry
    return lines.map((line) => {
      // If line already starts with -, *, or +, keep as is
      if (/^[-*+]\s/.test(line)) {
        return line;
      }
      // Otherwise, add bullet point
      return `- ${line}`;
    });
  }

  /**
   * Formats commits list for changelog
   */
  formatCommitsForChangelog() {
    if (!this.prCommits || this.prCommits.length === 0) {
      return '';
    }

    const repoUrl = `https://github.com/${this.repo}`;
    const commitEntries = this.prCommits
      .filter((commit) => commit.commit && commit.sha)
      .slice(-10) // Limit to last 10 commits to avoid overly long changelogs
      .map((commit) => {
        const shortSha = commit.sha.substring(0, 7);
        const message = commit.commit.message.split('\n')[0]; // First line only
        const commitUrl = `${repoUrl}/commit/${commit.sha}`;

        return `  - [\`${shortSha}\`](${commitUrl}) ${message}`;
      });

    if (commitEntries.length === 0) {
      return '';
    }

    return `\n**Commits:**\n${commitEntries.join('\n')}`;
  }

  /**
   * Updates CHANGELOG.md with new version entry
   */
  updateChangelog(version, bumpType) {
    // Usar moment.js para formatear la fecha
    const date = moment().format('YYYY-MM-DD');
    const datetime = moment().format('YYYY-MM-DD HH:mm:ss UTC');

    const entries = this.formatChangelogEntries();
    const commitsList = this.formatCommitsForChangelog();

    const changeTypeMap = {
      major: 'Breaking Changes',
      minor: 'Features',
      patch: 'Bug Fixes',
    };

    const changeType = changeTypeMap[bumpType] || 'Changes';

    // Create the PR section
    const prSection = `### ${changeType}
${entries.join('\n')}

**Pull Request**: [#${this.prNumber}](https://github.com/${this.repo}/pull/${this.prNumber}) - ${this.prTitle}${commitsList}

---
`;

    // Read or create CHANGELOG.md
    let existingContent = '';
    if (fs.existsSync(this.changelogPath)) {
      existingContent = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      existingContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
    }

    // Check if version already exists
    const versionHeaderRegex = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm');

    if (versionHeaderRegex.test(existingContent)) {
      // Version exists, add to existing section
      const versionSectionStart = existingContent.search(versionHeaderRegex);
      const nextVersionMatch = existingContent.substring(versionSectionStart + 1).match(/^## \[/m);
      const versionSectionEnd = nextVersionMatch
        ? versionSectionStart + 1 + nextVersionMatch.index
        : existingContent.length;

      const beforeVersion = existingContent.substring(0, versionSectionStart);
      const versionHeader = existingContent.substring(
        versionSectionStart,
        existingContent.indexOf('\n', versionSectionStart) + 1
      );
      const afterVersionHeader = existingContent.substring(versionSectionEnd);

      existingContent = beforeVersion + versionHeader + '\n' + prSection + afterVersionHeader;
    } else {
      // Version doesn't exist, create new section
      const newVersionSection = `## [${version}] - ${date}\n*Released: ${datetime}*\n\n${prSection}`;

      // Find the right place to insert (after the header but before other versions)
      const headerEndMatch = existingContent.match(/^(# Changelog.*?)\n\n/s);
      if (headerEndMatch) {
        const headerEnd = headerEndMatch.index + headerEndMatch[0].length;
        const beforeHeader = existingContent.substring(0, headerEnd);
        const afterHeader = existingContent.substring(headerEnd);
        existingContent = beforeHeader + newVersionSection + afterHeader;
      } else {
        // Fallback: add after first line
        const firstLineEnd = existingContent.indexOf('\n') + 1;
        const beforeFirstLine = existingContent.substring(0, firstLineEnd);
        const afterFirstLine = existingContent.substring(firstLineEnd);
        existingContent = beforeFirstLine + '\n' + newVersionSection + afterFirstLine;
      }
    }

    // Write the updated changelog
    fs.writeFileSync(this.changelogPath, existingContent);

    console.log(`📝 Changelog entry created for version ${version}`);
    console.log(`📅 Date: ${date} (${datetime})`);
    console.log(`🏷️  Change type: ${changeType}`);
    console.log(`📋 Entries: ${entries.length}`);
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
      console.log(`📎 PR Commits: ${this.prCommits.length}`);

      const bumpType = this.determineVersionBump();
      console.log(`📈 Version bump type: ${bumpType}`);

      const { currentVersion, newVersion } = this.updatePackageVersion(bumpType);
      console.log(`📦 Version updated: ${currentVersion} → ${newVersion}`);

      this.updateChangelog(newVersion, bumpType);
      console.log(`📋 Changelog updated with version ${newVersion}`);

      // Output for GitHub Actions (legacy format for backward compatibility)
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
