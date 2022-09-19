const core = require('@actions/core');
const github = require('@actions/github');
const { Parser } = require('json2csv');

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

const myReports = [
  {
    id: "1",
    createdAt: "1",
    dismissedAt: "1",
    dismissReason: "1",
    dismissComment: "1",
    state: "OPEN",
    securityAdvisory: {
        ghsaId: "1",
        description: "1",
        permalink: "1",
        severity: "1",
        summary: "1",
    },
    securityVulnerability: {
      package: {
        name: "1",
      },
      vulnerableVersionRange: "1",
    },
    vulnerableManifestFilename: "1",
    vulnerableManifestPath: "1",
    vulnerableRequirements: "1"
  }, {
    id: "2",
    createdAt: "2",
    dismissedAt: "2",
    dismissReason: "2",
    dismissComment: "2",
    state: "DISMISSED",
    securityAdvisory: {
        ghsaId: "2",
        description: "2",
        permalink: "2",
        severity: "2",
        summary: "2",
    },
    securityVulnerability: {
      package: {
        name: "2",
      },
      vulnerableVersionRange: "2",
    },
    vulnerableManifestFilename: "2",
    vulnerableManifestPath: "2",
    vulnerableRequirements: "2"
  }, {
    id: "3",
    createdAt: "3",
    dismissedAt: "3",
    dismissReason: "3",
    dismissComment: "3",
    state: "FIXED",
    securityAdvisory: {
        ghsaId: "3",
        description: "3",
        permalink: "3",
        severity: "3",
        summary: "3",
    },
    securityVulnerability: {
      package: {
        name: "3",
      },
      vulnerableVersionRange: "3",
    },
    vulnerableManifestFilename: "3",
    vulnerableManifestPath: "3",
    vulnerableRequirements: "3"
  }
];

const json2csvParserReports = new Parser({ fields });
const reportCSV = json2csvParserReports.parse(myReports);

console.log(reportCSV);

