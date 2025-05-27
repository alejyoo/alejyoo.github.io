interface Project {
  title: string
  description: string
  link: string
  image: string
  alt: string
}

interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  fork: boolean
}

const GITHUB_USERNAME = 'alejyoo'
const GITHUB_API_BASE = 'https://api.github.com'
const FALLBACK_IMAGE_BASE = 'https://opengraph.githubassets.com/1'

async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/users/${username}/repos?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.statusText}`)
  }

  return response.json()
}

function getTopRepos(repos: GitHubRepo[], count: number): GitHubRepo[] {
  return repos
    .filter(repo => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, count)
}

async function getRepoImage(
  username: string,
  repoName: string
): Promise<string> {
  const customImageUrl = `https://raw.githubusercontent.com/${username}/${repoName}/master/assets/cover-preview.png`

  try {
    const res = await fetch(customImageUrl, { method: 'HEAD' })
    if (res.ok) {
      return customImageUrl
    }
  } catch {}

  return `${FALLBACK_IMAGE_BASE}/${username}/${repoName}`
}

async function convertRepoToProject(repo: GitHubRepo): Promise<Project> {
  const image = await getRepoImage(GITHUB_USERNAME, repo.name)

  return {
    title: repo.name.toUpperCase(),
    description: repo.description || 'No description.',
    link: repo.html_url,
    image,
    alt: `${repo.name} app screenshot`
  }
}

export async function getTopProjects(): Promise<Project[]> {
  const allRepos = await fetchUserRepos(GITHUB_USERNAME)
  const topRepos = getTopRepos(allRepos, 2)

  const projects = await Promise.all(topRepos.map(convertRepoToProject))

  return projects
}
