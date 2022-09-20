// libs for github & graphql
const core = require('@actions/core');
const github = require('@actions/github');
const { parse } = require('json2csv');

// libs for csv file creation
const { dirname } = require("path");
const makeDir = require("make-dir");

// get the octokit handle 
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

// Graphql query for vulnerability data
const query =
  `query ($org_name: String! $repo_name: String! $pagination: String){
      repository(owner: $org_name name: $repo_name) {
        name
        vulnerabilityAlerts(first: 10 after: $pagination) {     
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

// Our CSV output fields
const fields = [{
  label: 'Id',
  value: 'id'
},
{
  label: 'State',
  value: 'state'
},
{
  label: 'Created At',
  value: 'createdAt'
},
{
  label: 'Manifest File Name',
  value: 'vulnerableManifestFilename'
},
{
  label: 'Vulnerability Version Range',
  value: 'securityVulnerability.vulnerableVersionRange'
},
{
  label: 'Package Name',
  value: 'securityVulnerability.package.name'
},
{
  label: 'GHAS Id',
  value: 'securityAdvisory.ghsaId'
},
{
  label: 'Severity',
  value: 'securityAdvisory.severity'
},
{
  label: 'Summary',
  value: 'securityAdvisory.summary'
},
{
  label: 'Link',
  value: 'securityAdvisory.permalink'
},
{
  label: 'Description',
  value: 'securityAdvisory.description'
}
];

// graphql query execution
async function getAlerts(org, repo, pagination) {
  try {
    console.log(pagination ? `${pagination}` : null);
    console.log(`pagination ${pagination}`);
    console.log(pagination);

    return await octokit.graphql(query, { org_name: `${org}`, repo_name: `${repo}`, pagination: (pagination ? `${pagination}` : null) });
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Extract vulnerability alerts with a pagination of 50 alerts per page
async function run(org_Name, repo_Name, csv_path) {

  let reportsCSV = "";
  let pagination = null;
  let hasNextPage = false;
  let addTitleRow = true;

  do {
    // invoke the graphql query execution
    await getAlerts(org_Name, repo_Name, pagination).then(alertResult => {
      let vulnerabilityNodes = alertResult.repository.vulnerabilityAlerts.nodes;
      const opts = { fields, "header": addTitleRow };
      console.log(`totalCount: ${alertResult.repository.vulnerabilityAlerts.totalCount}`);
 
      // append to reportsCSV
      reportsCSV = reportsCSV.concat(parse(vulnerabilityNodes, opts));

      // pagination to get next page data
      let pageInfo = alertResult.repository.vulnerabilityAlerts.pageInfo;
      hasNextPage = pageInfo.hasNextPage;
      if (hasNextPage) {
        pagination = pageInfo.endCursor;
        addTitleRow = false;
      }
      console.log(`hasNextPage:  ${hasNextPage}`);
      console.log(`Pagination cursor: ${pagination}`);
      console.log(`addTitleRow: ${addTitleRow}`);

    });
  } while (hasNextPage);

  try {
    await makeDir(dirname(csv_path));
    require("fs").writeFileSync(csv_path, reportsCSV)
  } catch (error) {
    core.setFailed(error.message);
  }
}

// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const repo_Name = core.getInput('repo_name');
const csv_path = core.getInput('csv_path');

console.log(`org name ${org_Name}   repo name ${repo_Name}`);

// run the action code
run(org_Name, repo_Name, csv_path);