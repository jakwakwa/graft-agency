import { Octokit } from "@octokit/rest";

export interface BuildRepoResult {
  repoFullName: string;
  htmlUrl: string;
  cloneUrl: string;
}

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  return new Octokit({ auth: token });
}

function getTemplateRepo(): { owner: string; repo: string } {
  const templateRepo = process.env.GITHUB_TEMPLATE_REPO ?? "graft-today-agency/prototype-template";
  const [owner, repo] = templateRepo.split("/");
  if (!owner || !repo) throw new Error("Invalid GITHUB_TEMPLATE_REPO format — expected 'owner/repo'");
  return { owner, repo };
}

function getBuildsOrg(): string {
  return process.env.GITHUB_BUILDS_ORG ?? "graft-today-builds";
}

export async function createBuildRepo(params: {
  companySlug: string;
  buildId: string;
}): Promise<BuildRepoResult> {
  const octokit = getOctokit();
  const template = getTemplateRepo();
  const buildsOrg = getBuildsOrg();
  const repoName = `${params.companySlug}-${params.buildId}`.slice(0, 100).replace(/[^a-z0-9-]/gi, "-");

  const { data } = await octokit.repos.createUsingTemplate({
    template_owner: template.owner,
    template_repo: template.repo,
    owner: buildsOrg,
    name: repoName,
    private: true,
    description: `Prototype build for ${params.companySlug}`,
  });

  return { repoFullName: data.full_name, htmlUrl: data.html_url, cloneUrl: data.clone_url };
}

export async function createJulesIssue(params: {
  repoFullName: string;
  prdContent: string;
  designDescription: string;
}): Promise<string> {
  const octokit = getOctokit();
  const parts = params.repoFullName.split("/");
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) throw new Error("Invalid repoFullName format — expected 'owner/repo'");

  const issueBody = `## Build Request — GRAFT.TODAY Autonomous Pipeline

${params.prdContent}

---

## Design Specification

${params.designDescription}

---

## Build Instructions for Jules

1. Implement all MVP features listed in the PRD above
2. Use the design specification for all styling decisions
3. Stack: Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, TypeScript
4. Deploy target: Vercel — ensure \`vercel.json\` is present with \`{ "buildCommand": "next build" }\`
5. All pages must be responsive (mobile-first)
6. No backend required — static data or localStorage is fine for the prototype
7. Commit all changes to main branch in a single PR

When done, open a PR titled: \`feat: prototype build\``;

  const { data } = await octokit.issues.create({
    owner,
    repo,
    title: "🤖 Build prototype — jules",
    body: issueBody,
    labels: ["jules"],
  });

  return data.html_url;
}
