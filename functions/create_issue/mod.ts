// functions/create_issue/mod.ts

import { SlackFunction } from "deno-slack-sdk/mod.ts";
import CreateIssueDefinition from "./definition.ts";

// https://docs.github.com/en/rest/issues/issues#create-an-issue
export default SlackFunction(
  CreateIssueDefinition,
  async ({ inputs, env }) => {
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + env.GITHUB_TOKEN,
      "Content-Type": "application/json",
    };

    const { url, title, description, assignees } = inputs;

    try {
      const { hostname, pathname } = new URL(url);
      const [_, owner, repo] = pathname.split("/");

      // https://docs.github.com/en/enterprise-server@3.3/rest/guides/getting-started-with-the-rest-api
      const apiURL = hostname === "github.com"
        ? "api.github.com"
        : `${hostname}/api/v3`;
      const issueEndpoint = `https://${apiURL}/repos/${owner}/${repo}/issues`;
      console.log(issueEndpoint);
      const body = JSON.stringify({
        title,
        body: description,
        assignees: assignees?.split(",").map((assignee: string) => {
          return assignee.trim();
        }),
      });

      const issue = await fetch(issueEndpoint, {
        method: "POST",
        headers,
        body,
      }).then((res: Response) => {
        if (res.status === 201) return res.json();
        else throw new Error(`${res.status}: ${res.statusText}`);
      });

      return {
        outputs: {
          GitHubIssueNumber: issue.number,
          GitHubIssueLink: issue.html_url,
        },
      };
    } catch (err) {
      console.error(err);
      return {
        error:
          `An error was encountered during issue creation: \`${err.message}\``,
      };
    }
  },
);
