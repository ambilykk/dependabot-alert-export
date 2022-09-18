const core = require('@actions/core');
const github = require('@actions/github');
// const graphql = require('@octokit/graphql');

const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

const query =
    `query ($org_name: String! $repo_name: String!){
      repository(owner: $org_name name: $repo_name) {
        name
        vulnerabilityAlerts(first: 50) {         
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

async function getAlerts(org, repo) {
    try {
        return await octokit.graphql(query, { org_name: `${org}`, repo_name: `${repo}` });
    } catch (error) {
        core.setFailed(error.message);
    }
}


// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const repo_Name = core.getInput('repo_name');
console.log(`org name ${org_Name}   repo name ${repo_Name}`);

const context = github.context;
const repo = context.payload.repository.name;
console.log(`context org name ${repo} `);

getAlerts(org_Name, repo_Name).then(alertResult => {
    console.log(`data ${alertResult}`);
    let alertResultJsonObj=JSON.parse(JSON.stringify(alertResult));
    let vulnerabilityData=JSON.parse(JSON.stringify(alertResultJsonObj.repository)).vulnerabilityAlerts;
    let count=vulnerabilityData.totalCount;
    let vulnerabilityNodes=JSON.parse(JSON.stringify(vulnerabilityData.nodes));

    console.log(`total count ${count}`);
    console.log(`length  ${vulnerabilityNodes.length}`);

    for (let i=0; i<vulnerabilityNodes.length;i++) {
        const vul=JSON.parse(JSON.stringify(vulnerabilityNodes[i]));
        console.log(`Vulnerability data ${vul.id}  ${vul.state}`);
    }
});

