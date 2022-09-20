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
// ALERT! - see how we have now added the owner object? Both Users and Orgnizations share the same "login" field to denote the organization name
const query =
  `query ($org_name: String! $repo_name: String! $pagination: String){
      repository(owner: $org_name name: $repo_name) {
        name
        owner {
          login
        }
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
            dependencyScope
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

    // ALERT! - grab the repo name and owner login from the result data
      // Our CSV output fields
  const fields = [{
      label: 'Repository',
      value: 'repository.name'
    },
    {
      label: 'Organization',
      value: 'repository.owner.login'
    },
    {
      label: 'Id',
      value: 'repository.vulnerabilityAlerts.nodes.id'
    },
    {
      label: 'State',
      value: 'repository.vulnerabilityAlerts.nodes.state'
    },
    {
      label: 'Scope',
      value: 'repository.vulnerabilityAlerts.nodes.dependencyScope'
    },
    {
      label: 'Created At',
      value: 'repository.vulnerabilityAlerts.nodes.createdAt'
    },
    {
      label: 'Manifest File Name',
      value: 'repository.vulnerabilityAlerts.nodes.vulnerableManifestFilename'
    },
    {
      label: 'Vulnerability Version Range',
      value: 'repository.vulnerabilityAlerts.nodes.securityVulnerability.vulnerableVersionRange'
    },
    {
      label: 'Package Name',
      value: 'repository.vulnerabilityAlerts.nodes.securityVulnerability.package.name'
    },
    {
      label: 'GHSA Id',
      value: 'repository.vulnerabilityAlerts.nodes.securityAdvisory.ghsaId'
    },
    {
      label: 'Severity',
      value: 'repository.vulnerabilityAlerts.nodes.securityAdvisory.severity'
    },
    {
      label: 'Summary',
      value: 'repository.vulnerabilityAlerts.nodes.securityAdvisory.summary'
    },
    {
      label: 'Link',
      value: 'repository.vulnerabilityAlerts.nodes.securityAdvisory.permalink'
    },
    {
      label: 'Description',
      value: 'repository.vulnerabilityAlerts.nodes.securityAdvisory.description'
    }];

// graphql query execution
async function getAlerts(org, repo, pagination) {
  try {
    console.log(`getAlerts(): pagination: ${pagination ? pagination: null}` );

    return await octokit.graphql(query, { org_name: `${org}`, repo_name: `${repo}`, pagination: (pagination ? `${pagination}` : null) });
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Extract vulnerability alerts with a pagination of 50 alerts per page
async function run(org_Name, repo_Name, csv_path) {

  let pagination = null;
  let hasNextPage = false;
  let addTitleRow = true;

  try {
    await makeDir(dirname(csv_path));
    do {
      // invoke the graphql query execution
      await getAlerts(org_Name, repo_Name, pagination).then(alertResult => {

        // ALERT! - create our updated opts
        const opts = { fields, "header": addTitleRow };
  
        // append to the existing file (or create and append if needed)
        require("fs").appendFileSync(csv_path, `${parse(alertResult, opts)}\n`);

        // pagination to get next page data
        let pageInfo = alertResult.repository.vulnerabilityAlerts.pageInfo;
        hasNextPage = pageInfo.hasNextPage;
        if (hasNextPage) {
          pagination = pageInfo.endCursor;
          addTitleRow = false;
        }
        console.log(`run(): hasNextPage:  ${hasNextPage}`);
        console.log(`run(): Pagination cursor: ${pagination}`);
        console.log(`run(): addTitleRow: ${addTitleRow}`);

      });
    } while (hasNextPage);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// inputs defined in action metadata file
const org_Name = core.getInput('org_name');
const repo_Name = core.getInput('repo_name');
const csv_path = core.getInput('csv_path');

console.log(`preamble: org name: ${org_Name}   repo name: ${repo_Name}`);

// run the action code
run(org_Name, repo_Name, csv_path);