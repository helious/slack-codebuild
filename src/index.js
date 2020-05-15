#!/usr/bin/env node
const { execSync } = require('child_process')
const got = require("got");

async function main() {
    const url = `${process.env.SLACK_WEBHOOK_URL}`;

    if (!url) {
        throw new Error("Missing SLACK_WEBHOOK_URL environment variable.");
    }

    console.log(process.env.CODEBUILD_SOURCE_VERSION);
    console.log(process.env.CODEBUILD_SOURCE_REPO_URL);
    console.log(process.env);

    const buildLink = process.env.CODEBUILD_BUILD_URL;
    const gitCommitMessage = execSync('git log -1 --pretty=%B').toString().split(
        "\n"
    ).slice(-1);
    const prLink = `${process.env.CODEBUILD_SOURCE_REPO_URL}/pull/${
        process.env.CODEBUILD_SOURCE_VERSION.split("pr/")[1]
    }`;
    const success = `${process.env.CODEBUILD_BUILD_SUCCEEDING}` === "1";

    await got(url, {
        method: "POST",
        body: JSON.stringify({
            attachments: [
                {
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: success
                                    ? `Deployment successful to https://web.payments.shootproof.dev\n\n<${prLink}|${gitCommitMessage}>`
                                    : "Deployment failed to https://web.payments.shootproof.dev",
                            },
                            accessory: {
                                type: "overflow",
                                options: [
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "View Pull Request",
                                        },
                                        url: prLink,
                                    },
                                    {
                                        text: {
                                            type: "plain_text",
                                            text: "View Build Details",
                                        },
                                        url: buildLink,
                                    },
                                ],
                            },
                        },
                    ],
                    color: success ? "good" : "danger",
                    fallback: success ? "Build success!" : "Build failure.",
                },
            ],
        }),
    });
}

main().catch((err) => console.log(`${err.message || err}`));
