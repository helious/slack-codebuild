#!/usr/bin/env node
const { execSync } = require("child_process");
const got = require("got");

async function main() {
    const url = `${process.env.SLACK_WEBHOOK_URL}`;

    if (!url) {
        throw new Error("Missing SLACK_WEBHOOK_URL environment variable.");
    }

    console.log(execSync("git log -1 --merges --pretty=%B").toString());

    const buildUrl = process.env.CODEBUILD_BUILD_URL;
    const [mergeCommit, _, commit] = execSync("git log -1 --merges --pretty=%B")
        .toString()
        .split("\n");
    const getOverflowOption = (text, url) => ({
        text: {
            type: "plain_text",
            text,
        },
        url,
    });
    const prNumber = mergeCommit.match(/#([0-9]*)/)[1];
    const sourceRepoUrl = process.env.CODEBUILD_SOURCE_REPO_URL.replace(
        ".git",
        ""
    );
    const sourceUrl = `${sourceRepoUrl}/pull/${prNumber}`;
    const overflowOptions = [
        getOverflowOption("View Build in AWS", buildUrl),
        getOverflowOption("View Pull Request on GitHub", sourceUrl),
    ];
    const success = `${process.env.CODEBUILD_BUILD_SUCCEEDING}` === "1";
    let [jiraTicket, commitDescription] = commit.split(":");
    let jiraLink = "";

    if (commitDescription) {
        const jiraUrl = `https://tickets.dev.shootproof.com/browse/${jiraTicket}`;

        jiraLink = `<${jiraUrl}|${jiraTicket}>: `;

        overflowOptions.push(getOverflowOption("View Ticket in JIRA", jiraUrl));
    } else {
        commitDescription = jiraTicket;
    }

    await got(url, {
        method: "POST",
        body: JSON.stringify({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: success
                            ? `✅ Deployment successful to https://web.payments.shootproof.dev\n\n${jiraLink}<${sourceUrl}|${commitDescription}>`
                            : "🚨 Deployment failed to https://web.payments.shootproof.dev",
                    },
                    accessory: {
                        type: "overflow",
                        options: overflowOptions,
                    },
                },
            ],
        }),
    });
}

main().catch((err) => console.log(`${err.message || err}`));
