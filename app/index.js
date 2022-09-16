const core = require('@actions/core');
const github = require('@actions/github');
// const graphql = require('@octokit/graphql');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

const query =
    `query ($org_name: String! $repo_name: String!){
      repository(owner: $org_name name: $repo_name) {
        name
        vulnerabilityAlerts(first: 500) {         
          totalCount
          nodes {
            id
            createdAt
            dismissedAt
            dismissReason
            dismissComment
            state
            securityAdvisory {
                ghsaId
                description
                permalink
                severity
                summary
            }
            securityVulnerability {
              package {
                name
              }
              vulnerableVersionRange
            }
            vulnerableManifestFilename
            vulnerableManifestPath
            vulnerableRequirements
          }
        }
      }
    }`
    getAlerts();

async function getAlerts() {
    try {

        // inputs defined in action metadata file
        const org_Name = core.getInput('org_name');
        const repo_Name = core.getInput('repo_name');
        console.log(`org name ${org_Name}   repo name ${repo_Name}`);
        
        const { context = {} } = github;
        console.log(`context org name ${context.org}   context repo name ${context.repo}`);

        const alertResult = await octokit.graphql(query, { org: org_Name, repo: repo_Name });
        for (const vulnerability in alertResult.repository.vulnerabilityAlerts.nodes) {
            console.log(vulnerability.id + "   " + vulnerability.state);
            console.log(vulnerability.securityAdvisory.description + "   " + vulnerability.securityVulnerability.package.name);
        }

    } catch (error) {
        core.setFailed(error.message);
    }

}
