// libs for github & graphql
const core = require('@actions/core');
const github = require('@actions/github');
const { Parser } = require('json2csv');

// libs for csv file creation
const { dirname } = require("path");
const { existsSync, appendFileSync } = require("fs");
const CSV = require("csv-string");
const makeDir = require("make-dir");

// get the octokit handle 
const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
const octokit = github.getOctokit(GITHUB_TOKEN);

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

// Write the Vulnerability report to csv file
// async function writeToCSV(path, vulnerabilityNodes) {
//   const rows = [];

//   // define the report columns
//   let columns = `Id, State, Created At, Manifest File Name, Vulnerability Version Range, Package Name, GHAS Id, Severity, Summary, Link, Description `;
//   let data = "";

//   // If file not exists, create the column headings
//   if (!existsSync(path)) {
//     rows.push(CSV.stringify(columns));
//   }

//   try {

//     // loop through the vulnerability data for form the csv file rows
//     for (let i = 0; i < vulnerabilityNodes.length; i++) {
//       const vul = JSON.parse(JSON.stringify(vulnerabilityNodes[i]));
//       data = vul.id + `, ` + vul.state + `, ` + vul.createdAt + `, ` + vul.vulnerableManifestFilename + `, `;

//       //security vulnerability data
//       const secVul = JSON.parse(JSON.stringify(vul.securityVulnerability));
//       data += secVul.vulnerableVersionRange + ', ' + JSON.parse(JSON.stringify(secVul.package)).name + `, `;

//       // Security Advisory data
//       const secAdv = JSON.parse(JSON.stringify(vul.securityAdvisory));
//       data += secAdv.ghsaId + `, ` + secAdv.severity + `, ` + secAdv.summary + `, ` + secAdv.permalink + `, ` + secAdv.description;

//       rows.push(CSV.stringify(data));
//     }

//     // create the path & file
//     await makeDir(dirname(path));
//     // write to the file
//     appendFileSync(path, rows.join(""));
//   } catch (error) {
//     core.setFailed(error.message);
//   }
// }

// Extract vulnerability alerts with a pagination of 50 alerts per page
async function run(org_Name, repo_Name, csv_path) {
  const json2csvParserReports = new Parser({ fields });
  let reportsCSV = "";
//  const reportsCSV = json2csvParserReports.parse(myReports);

  let pagination = null;
  let hasNextPage = false;
  do {
    // invoke the graphql query execution
    await getAlerts(org_Name, repo_Name, pagination).then(alertResult => {
      let vulnerabilityNodes = alertResult.repository.vulnerabilityAlerts.nodes;
 // append to reportsCSV
      reportsCSV = reportsCSV.concat(json2csvParserReports.parse(vulnerabilityNodes));

      // pagination to get next page data
      let pageInfo = alertResult.repository.vulnerabilityAlerts.pageInfo;
      hasNextPage = pageInfo.hasNextPage;
      if (hasNextPage) {
        pagination = pageInfo.endCursor
      }
      console.log(`hasNextPage  ${hasNextPage}`);
      console.log(`Pagination cursor ${pagination}`);

    });
  } while (hasNextPage);

  try {
    require("fs").writeFileSync(csv_path, reportsCSV)
  } catch (error) {
    core.setFailed(error.message);
  }
  // console.log("reportsCSV:\n" + reportsCSV);
}

// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const repo_Name = core.getInput('repo_name');
const csv_path = core.getInput('csv_path');

console.log(`org name ${org_Name}   repo name ${repo_Name}`);

// run the action code
run(org_Name, repo_Name, csv_path);