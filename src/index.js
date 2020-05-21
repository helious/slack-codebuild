#!/usr/bin/env node
const { execSync } = require("child_process");
const got = require("got");

async function main() {
    const url = `${process.env.SLACK_WEBHOOK_URL}`;

    if (!url) {
        throw new Error("Missing SLACK_WEBHOOK_URL environment variable.");
    }

    const buildUrl = process.env.CODEBUILD_BUILD_URL;
    const buildLink = {
        text: {
            type: "plain_text",
            text: "View Build Details",
        },
        url: buildUrl,
    };
    const [mergeCommit, mergeBody] = execSync("git log -1 --pretty=%B")
        .toString()
        .split("\n")
        .filter((message) => !!message);
    const prNumber = mergeCommit.match(/#[0-9]*/)[0].split("#")[1];
    const sourceRepoUrl = process.env.CODEBUILD_SOURCE_REPO_URL.replace(
        ".git",
        ""
    );
    const sourceUrl = `${sourceRepoUrl}/pull/${prNumber}`;
    const success = `${process.env.CODEBUILD_BUILD_SUCCEEDING}` === "1";

    await got(url, {
        method: "POST",
        body: JSON.stringify({
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: success
                            ? `✅ Deployment successful to https://web.payments.shootproof.dev\n\n<${sourceUrl}|${mergeBody}>`
                            : "🚨 Deployment failed to https://web.payments.shootproof.dev",
                    },
                    accessory: {
                        type: "overflow",
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: `View Pull Request`,
                                },
                                url: sourceUrl,
                            },
                            buildLink,
                        ],
                    },
                },
            ],
        }),
    });
}

main().catch((err) => console.log(`${err.message || err}`));
