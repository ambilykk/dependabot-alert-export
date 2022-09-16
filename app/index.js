const core = require('@actions/core');
const github = require('@actions/github');
const graphql = require('@octokit/graphql');

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
        console.log(`context org name ${github.context.orgName}   context repo name ${github.context.repoName}`);
        // If the org and repo names are empty, set the current org and repo names
        if (!org_Name) {
            org_Name = github.context.orgName;
        }
        if (!repo_Name) {
            repo_Name = github.context.repoName;
        }


        const alertResult = await graphql(query, { org: org_Name, repo: repo_Name });
        for (const vulnerability in alertResult.repository.vulnerabilityAlerts.nodes) {
            console.log(vulnerability.id + "   " + vulnerability.state);
            console.log(vulnerability.securityAdvisory.description + "   " + vulnerability.securityVulnerability.package.name);
        }

    } catch (error) {
        core.setFailed(error.message);
    }

}
