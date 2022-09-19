// libs for github & graphql
const core = require('@actions/core');
const github = require('@actions/github');

// libs for csv file creation
const { dirname } = require("path");
const { existsSync, appendFileSync } = require("fs");
const CSV = require("csv-string");
const makeDir = require("make-dir");

// get the octokit handle 
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

// Graphql query for vulnerability data
const query =
  `query ($org_name: String! $repo_name: String! $pagination: String){
      repository(owner: $org_name name: $repo_name) {
        name
        vulnerabilityAlerts(first: 50 after: $pagination) {     
          pageInfo {
              hasNextPage
              endCursor
          }    
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

// graphql query execution
async function getAlerts(org, repo, pagination) {
  try {
    console.log(pagination? `${pagination}`: null);
    console.log(`pagination ${pagination}`);
    console.log(pagination);

    return await octokit.graphql(query, { org_name: `${org}`, repo_name: `${repo}`, pagination: (pagination? `${pagination}`: null) });
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Write the Vulnerability report to csv file
async function writeToCSV(path, vulnerabilityNodes) {
  const rows = [];

  // define the report columns
  let columns = `Id, State, Created At, Manifest File Name, Vulnerability Version Range, Package Name, GHAS Id, Severity, Summary, Link, Description `;
  let data = "";

  // If file not exists, create the column headings
  if (!existsSync(path)) {
    rows.push(CSV.stringify(columns));
  }

  try {

    // loop through the vulnerability data for form the csv file rows
    for (let i = 0; i < vulnerabilityNodes.length; i++) {
      const vul = JSON.parse(JSON.stringify(vulnerabilityNodes[i]));
      data = vul.id + `, ` + vul.state + `, ` + vul.createdAt + `, ` + vul.vulnerableManifestFilename + `, `;

      //security vulnerability data
      const secVul = JSON.parse(JSON.stringify(vul.securityVulnerability));
      data += secVul.vulnerableVersionRange + ', ' + JSON.parse(JSON.stringify(secVul.package)).name + `, `;

      // Security Advisory data
      const secAdv = JSON.parse(JSON.stringify(vul.securityAdvisory));
      data += secAdv.ghsaId + `, ` + secAdv.severity + `, ` + secAdv.summary + `, ` + secAdv.permalink + `, ` + secAdv.description;

      rows.push(CSV.stringify(data));
    }

    // create the path & file
    await makeDir(dirname(path));
    // write to the file
    appendFileSync(path, rows.join(""));
  } catch (error) {
    core.setFailed(error.message);
  }
}

// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const repo_Name = core.getInput('repo_name');
const csv_path = core.getInput('csv_path');

console.log(`org name ${org_Name}   repo name ${repo_Name}`);

let pagination = null;
let hasPage = false;
do {
  // invoke the graphql query execution
  getAlerts(org_Name, repo_Name, pagination).then(alertResult => {

    // iterative parsing of the graphql query result
    let alertResultJsonObj = JSON.parse(JSON.stringify(alertResult));
    let vulnerabilityData = JSON.parse(JSON.stringify(alertResultJsonObj.repository)).vulnerabilityAlerts;
    let count = vulnerabilityData.totalCount;

    let vulnerabilityNodes = JSON.parse(JSON.stringify(vulnerabilityData.nodes));
    // write to the csv file
    writeToCSV(csv_path, vulnerabilityNodes);

    // pagination to get next page data
    let pageInfo = JSON.parse(JSON.stringify(vulnerabilityData.pageInfo));
    console.log(`pageInfo ${JSON.stringify(pageInfo)}`);
    
    hasPage = pageInfo.hasNextPage;
    if (hasPage) {
      pagination = pageInfo.endCursor
    }
    console.log(`hasPage  ${hasPage}`);
    console.log(`Pagination cursor ${pagination}`);
    
  });
} while (hasPage);

