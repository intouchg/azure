import { chunk } from '@i/utility'

// This is also called a "Project Collection"
// in Azure DevOps Server 2019
export type AzureOrganization = {
    id: string
    name: string
    url: string
}

export type AzureOrganizationData = {
    id: string
    name: string
    apiUrl: string
    collectionUrl: string
}

export type AzureTeamProject = {
    id: string
    name: string
    url: string
    description: string
    lastUpdateTime: string
    revision: number
    state: string
    visibility: string
}

export type AzureGitRepo = {
    id: string
    name: string
    url: string
    remoteUrl: string
    webUrl: string
    sshUrl: string
    defaultBranch: string
    project: AzureTeamProject
    size: number
}

const ORGANIZATIONS_ENDPOINT = '/_apis/projectCollections?api-version=1.0'
const GIT_ENDPOINT = '/_apis/git/repositories?api-version=5.1'
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

export class AzureUserConnection {
    instanceUrl: string
    authHeaders: { Authorization: string, 'Content-Type': string, 'User-Agent': string }
    concurrency: number
    organizations: AzureOrganizationData[]
    gitRepos: [ AzureOrganization['name'], AzureGitRepo[] ][]
    lastOrganizationSync: Date | null
    lastGitRepoSync: Date | null
    isFetching: boolean // Whether we are currently fetching organizations or git repos

    constructor ({
        instanceUrl,
        username,
        accessToken,
        concurrency = 10,
    }: {
        instanceUrl: string
        username: string
        accessToken: string
        concurrency: number
    }) {
        this.instanceUrl = instanceUrl
        this.authHeaders = {
            Authorization: `Basic ${Buffer.from(`${username}:${accessToken}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        }
        this.concurrency = concurrency
        this.organizations = []
        this.gitRepos = []
        this.lastOrganizationSync = null
        this.lastGitRepoSync = null
        this.isFetching = false
    }

    async azureRequest (url: string): Promise<any> {
        return await fetch(url, { headers: this.authHeaders })
            .then(({ status, json }) => {
                if (status >= 200 && status <= 299) {
                    return json()
                }
                else {
                    throw { status, url }
                }
            })
            .catch((error) => {
                throw error
            })
    }

    async getOrganizations () {
        try {
            if (this.isFetching) {
                console.error('@i/azure attempted to getOrganizations while fetching was already in progress')
                return
            }

            this.organizations = []
            this.isFetching = true
            const organizationsResponse = await this.azureRequest(this.instanceUrl + ORGANIZATIONS_ENDPOINT)
            const organizationsData = (organizationsResponse.value || []) as AzureOrganization[]

            this.organizations = organizationsData.map(({ id, name, url }) => ({
                id,
                name,
                apiUrl: `${this.instanceUrl}/${name}`,
                collectionUrl: url,
            }))

            this.lastOrganizationSync = new Date()

            this.isFetching = false
            return this.organizations
        }
        catch (error) {
            this.isFetching = false
            throw error
        }
    }

    async getGitRepos () {
        try {
            if (this.isFetching) {
                console.error('@i/azure attempted to getGitRepos while fetching was already in progress')
                return
            }

            if (this.organizations.length === 0) {
                await this.getOrganizations()
            }

            this.gitRepos = []
            this.isFetching = true
            const organizationChunks = chunk(this.organizations, this.concurrency)

            for (const organizationChunk of organizationChunks) {
                await Promise.all(organizationChunk.map(async ({ name, apiUrl }) => {
                    let repos = []

                    try {
                        const response = await this.azureRequest(apiUrl + GIT_ENDPOINT)
                        repos = response.value || []
                    }
                    catch (error) {
                        console.error(error)
                    }

                    this.gitRepos.push([ name, repos ])
                }))
            }

            this.lastGitRepoSync = new Date()
            this.isFetching = false

            return this.gitRepos
        }
        catch (error) {
            this.isFetching = false
            throw error
        }
    }

}