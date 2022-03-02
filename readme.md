# @intouchg/azure

Azure DevOps API integration for the Intouch Design System
<br>



### Usage

This module currently exports a single class `AzureUserConnection`:

```js
import { AzureUserConnection } from '@intouchg/azure'

// AzureUserConnection constructor takes an options object which contains
// the Azure DevOps instance URL, a username, a Personal Access Token, and
// an optional concurrency value (number of simultaneous requests to make)
const connection = new AzureUserConnection({
    instanceUrl: 'https://my-azure-instance.example.com',
    username: 'john.doe@example.com',
    accessToken: 'Z3wP8OiQDZ9VvPdgSNGe91RviDldRxyBCsfneLVbIIMDRVIqqnzN',
    concurrency: 15, // Default 10
})
const organizations = await connection.getOrganizations()
const gitRepos = await connection.getGitRepos()
```
<br>

**Note:** This module makes use of `fetch` due to the availability of polyfills, such as in Sketch.
<br>



### Dev Documentation

* [Azure DevOps REST API 5.1 Reference](https://docs.microsoft.com/en-us/rest/api/azure/devops/core/?view=azure-devops-rest-5.1)

**Note:** Make sure you are viewing the appropriate version of the Azure DevOps REST documentation. At the time of writing, the correct version is `Azure DevOps Server 2019` which uses version `5.1` of the REST API.
<br>
