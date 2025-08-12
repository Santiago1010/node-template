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
    this.prAuthor = process.env.PR_AUTHOR || '';
    this.prApprover = process.env.PR_APPROVER || '';
    this.prProjects = JSON.parse(process.env.PR_PROJECTS || '[]');
    this.prMilestone = process.env.PR_MILESTONE || '';

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
   * Maps PR labels to changelog type checkboxes
   */
  mapLabelsToTypeOfChange() {
    const labelNames = this.prLabels.map((label) => label.name.toLowerCase());

    const typeMapping = {
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

    return typeMapping;
  }

  /**
   * Extracts sections from PR body for "What Changed"
   */
  extractWhatChanged() {
    if (!this.prBody.trim()) {
      return { added: ['N/A'], changed: ['N/A'], fixed: ['N/A'], removed: ['N/A'] };
    }

    const sections = {
      added: [],
      changed: [],
      fixed: [],
      removed: [],
    };

    const bodyLower = this.prBody.toLowerCase();

    // Simple heuristics to categorize changes
    if (bodyLower.includes('add') || bodyLower.includes('new') || bodyLower.includes('implement')) {
      sections.added.push('Enhanced functionality based on PR description');
    }

    if (
      bodyLower.includes('updat') ||
      bodyLower.includes('modif') ||
      bodyLower.includes('chang') ||
      bodyLower.includes('improv')
    ) {
      sections.changed.push('Updated components based on PR description');
    }

    if (bodyLower.includes('fix') || bodyLower.includes('resolv') || bodyLower.includes('correct')) {
      sections.fixed.push('Fixed issues based on PR description');
    }

    if (bodyLower.includes('remov') || bodyLower.includes('delet')) {
      sections.removed.push('Removed components based on PR description');
    }

    // Fill empty sections with N/A
    Object.keys(sections).forEach((key) => {
      if (sections[key].length === 0) {
        sections[key] = ['N/A'];
      }
    });

    return sections;
  }

  /**
   * Extracts related issues from PR body
   */
  extractRelatedIssues() {
    if (!this.prBody.trim()) {
      return 'N/A';
    }

    const issuePatterns = [/(?:closes?|fixes?|resolves?)\s+#(\d+)/gi, /(?:related\s+to|see)\s+#(\d+)/gi, /#(\d+)/g];

    const issues = new Set();

    issuePatterns.forEach((pattern) => {
      let match = pattern.exec(this.prBody);
      while (match !== null) {
        issues.add(match[1]);
        match = pattern.exec(this.prBody);
      }
    });

    if (issues.size === 0) {
      return 'N/A';
    }

    return Array.from(issues)
      .map((issue) => `#${issue}`)
      .join(', ');
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

    return `**Commits:**\n${commitEntries.join('\n')}`;
  }

  /**
   * Generates the complete changelog entry with the exact required format
   */
  generateChangelogEntry(version) {
    const date = moment().format('YYYY-MM-DD');
    const datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss UTC');

    const repoUrl = `https://github.com/${this.repo}`;
    const prUrl = `${repoUrl}/pull/${this.prNumber}`;

    // Clean PR body for summary (first few sentences, remove markdown)
    let summary = this.prBody.trim();
    if (summary) {
      // Remove markdown headers and take first paragraph
      summary = summary
        .split('\n\n')[0]
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .trim();

      if (summary.length > 500) {
        summary = summary.substring(0, 500) + '...';
      }
    } else {
      summary = this.prTitle;
    }

    // Type of Change checkboxes
    const typeMapping = this.mapLabelsToTypeOfChange();
    const typeOfChange = [
      `- [${typeMapping.new_feature ? 'x' : ' '}] New feature (adds functionality)`,
      `- [${typeMapping.bug_fix ? 'x' : ' '}] Bug fix (non-breaking change)`,
      `- [${typeMapping.breaking_change ? 'x' : ' '}] Breaking change (breaks existing functionality)`,
      `- [${typeMapping.documentation ? 'x' : ' '}] Documentation update`,
      `- [${typeMapping.refactoring ? 'x' : ' '}] Code refactoring (no functional changes)`,
      `- [${typeMapping.performance ? 'x' : ' '}] Performance improvement`,
      `- [${typeMapping.testing ? 'x' : ' '}] Test coverage improvement`,
      `- [${typeMapping.build_system ? 'x' : ' '}] Build system changes`,
      `- [${typeMapping.ci_cd ? 'x' : ' '}] CI/CD changes`,
    ].join('\n');

    // What Changed sections
    const whatChanged = this.extractWhatChanged();
    const whatChangedSection = [
      '### Added',
      ...whatChanged.added.map((item) => `- ${item}`),
      '',
      '### Changed',
      ...whatChanged.changed.map((item) => `- ${item}`),
      '',
      '### Fixed',
      ...whatChanged.fixed.map((item) => `- ${item}`),
      '',
      '### Removed',
      ...whatChanged.removed.map((item) => `- ${item}`),
    ].join('\n');

    // Testing section (simple heuristic)
    const bodyLower = this.prBody.toLowerCase();
    const testingChecklist = [
      `- [${bodyLower.includes('unit test') ? 'x' : ' '}] Unit tests added/updated`,
      `- [${bodyLower.includes('integration test') ? 'x' : ' '}] Integration tests added/updated`,
      `- [x] Manual testing completed`,
      `- [${bodyLower.includes('test') && !bodyLower.includes('no test') ? 'x' : ' '}] All tests passing`,
    ].join('\n');

    // Additional Notes with metadata
    const labelsList = this.prLabels.length > 0 ? this.prLabels.map((l) => l.name).join(', ') : 'none';
    const additionalNotes = [
      `- Labels: ${labelsList}`,
      `- Author: ${this.prAuthor || 'Unknown'}`,
      this.prApprover ? `- Approved by: ${this.prApprover}` : '',
      this.prProjects.length > 0 ? `- Projects: ${this.prProjects.join(', ')}` : '',
      this.prMilestone ? `- Milestone: ${this.prMilestone}` : '',
      `- The changelog includes the last ${Math.min(this.prCommits.length, 10)} commits with SHA and message`,
      `- Date formatting follows YYYY-MM-DD pattern with UTC timestamps`,
      `- Auto-generated changelog entry based on PR content and metadata`,
    ]
      .filter((note) => note)
      .join('\n');

    // Checklist (simple heuristic)
    const checklist = [
      '- [x] Follows project style guidelines',
      '- [x] Self-reviewed my code',
      `- [${bodyLower.includes('comment') ? 'x' : ' '}] Commented complex logic`,
      `- [${bodyLower.includes('doc') ? 'x' : ' '}] Updated documentation`,
      '- [x] No new warnings',
      `- [${bodyLower.includes('test') && !bodyLower.includes('no test') ? 'x' : ' '}] Existing and new tests pass locally`,
    ].join('\n');

    const commitsSection = this.formatCommitsForChangelog();

    // Generate the complete changelog entry
    const changelogEntry = `# [${version}] - ${date}
> *Released: ${datetime}*

---

## [${this.prTitle}](${prUrl} "${this.prTitle}")

## 📋 Summary
${summary}

## 🎯 Type of Change
${typeOfChange}

## 🔍 What Changed
${whatChangedSection}

## 🧪 Testing
${testingChecklist}

**Test Instructions:**
1. Review the changes implemented in this PR
2. Verify functionality works as expected
3. Run existing test suite to ensure no regressions
4. Test edge cases if applicable
5. Confirm documentation is updated if needed

## 🔗 Related Issues
${this.extractRelatedIssues()}

## 📝 Additional Notes
${additionalNotes}

## ✅ Checklist
${checklist}

${commitsSection}

---

`;

    return changelogEntry;
  }

  /**
   * Updates CHANGELOG.md with new version entry
   */
  updateChangelog(version) {
    const changelogEntry = this.generateChangelogEntry(version);

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
    const versionHeaderRegex = new RegExp(`^# \\[${version.replace(/\./g, '\\.')}\\]`, 'm');

    if (versionHeaderRegex.test(existingContent)) {
      // Version exists, replace the existing section
      const versionStart = existingContent.search(versionHeaderRegex);
      const nextVersionMatch = existingContent.substring(versionStart + 1).match(/^# \[/m);
      const versionEnd = nextVersionMatch ? versionStart + 1 + nextVersionMatch.index : existingContent.length;

      const beforeVersion = existingContent.substring(0, versionStart);
      const afterVersion = existingContent.substring(versionEnd);

      existingContent = beforeVersion + changelogEntry + afterVersion;
    } else {
      // Version doesn't exist, create new section
      // Find the right place to insert (after the header but before other versions)
      const headerEndMatch = existingContent.match(/^(# Changelog.*?)\n\n/s);
      if (headerEndMatch) {
        const headerEnd = headerEndMatch.index + headerEndMatch[0].length;
        const beforeHeader = existingContent.substring(0, headerEnd);
        const afterHeader = existingContent.substring(headerEnd);
        existingContent = beforeHeader + changelogEntry + afterHeader;
      } else {
        // Fallback: add after first line
        const firstLineEnd = existingContent.indexOf('\n') + 1;
        const beforeFirstLine = existingContent.substring(0, firstLineEnd);
        const afterFirstLine = existingContent.substring(firstLineEnd);
        existingContent = beforeFirstLine + '\n' + changelogEntry + afterFirstLine;
      }
    }

    // Write the updated changelog
    fs.writeFileSync(this.changelogPath, existingContent);

    console.log(`📝 Changelog entry created for version ${version}`);
    console.log(`📅 Date: ${moment().format('YYYY-MM-DD')} (${moment().utc().format('YYYY-MM-DD HH:mm:ss UTC')})`);
    console.log(`🏷️  Labels: ${this.prLabels.map((l) => l.name).join(', ') || 'none'}`);
    console.log(`👤 Author: ${this.prAuthor || 'Unknown'}`);
    console.log(`✅ Approver: ${this.prApprover || 'Not specified'}`);
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
