import axios from "axios";
import * as nodemailer from "nodemailer";
import { pathOr } from "ramda";
import { config } from "./config";
import { env } from "./env";
import * as Util from "./util";
import { PassThrough } from "stream";
import account from './account.js';

/**
 * TODO:
 * 1. get categories from a config server
 * 2. define types of ts
 * 3. later, support graphQL
 */

const BREAKING_CHANGE = "breaking_change";
const NEW_FEATURE = "new_feature";
const UI_CHANGE = "ui_change";
const BUGFIX = "bugfix";
const REFACTOR = "refactor";
const TOOLING = "tooling";
const OTHER = "other";

const types = [
  BREAKING_CHANGE,
  NEW_FEATURE,
  BUGFIX,
  REFACTOR,
  TOOLING,
  UI_CHANGE,
  OTHER,
];

// TODO: Parse pull request type
function getPullRequestType(body: any) {
  return BREAKING_CHANGE;
}

function getSubTitle(type: string) {
  switch (type) {
    case BREAKING_CHANGE:
      return "** :skull_crossbones: Breaking Change **";
    case NEW_FEATURE:
      return "** :tada: New Feature **";
    case BUGFIX:
      return "** :white_check_mark: Bugfix **";
    case REFACTOR:
      return "** :first_place: Refactor **";
    case TOOLING:
      return "** :atom: Tooling **";
    case UI_CHANGE:
      return "** :boom: UI Change **";
    case OTHER:
      return "** :triangular_flag_on_post: Other **";
  }
}

/**
 * Send email
 * @param {object} content
 */
function sendEmail(content: string) {
  if (!content) return;

  const account = pathOr(undefined, ["email", "account"], env);
  const password = pathOr(undefined, ["email", "password"], env);
  const to = pathOr(undefined, ["email", "to"], env);
  const subject = pathOr(undefined, ["report", "subject"], config);

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: account,
      pass: password
    }
  });

  const mailOptions = {
    from: account,
    to: to,
    subject: subject,
    html: content
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.error("Send mail error: ", err);
    else console.log(info);
  });
}

/**
 * Get daily report from pull request.
 * @param {*} pullRequests
 */
function getDailyReport(prList: any) {
  if (!prList) {
    return;
  }

  let plen = 0;
  const items = types.map(type => ({ type, commits: [] }));

  parsePr(prList, items);
  const tpl = [`** Commits daily report on ${Util.getCurrentDate()} **`];

  for (const item of items) {
    const typeTpl = getSubTitle(item.type);
    tpl.push("");
    tpl.push(typeTpl);
    if (item.commits.length > 0) {
      for (const commit of item.commits) {
        tpl.push(commit);
      }
    }
  }
  return tpl.join("\n");
}

function parsePr(prList: any, items: any): any[] {
  let plen = 0;
  for (const pr of prList) {
    const { title, number, body } = pr;
    const tpl = `* ${title} ([#${number}](https://github.com/ringcentral/integration-apps/pull/${number}))`;

    if (body.startsWith("BREAKING CHANGE ") || body.startsWith("BREAKING CHANGE(") || body.startsWith("BREAKING CHANGE:")) {
      const breakingChangeTpl = `* ${body}`;
      items[0].commits.push(breakingChangeTpl);
      items[0].commits.push(`* ${title} ([#${number}](https://github.com/ringcentral/ringcentral-js-widgets/pull/${number}))`);
      items[0].commits.push('\n');
    }
    if (title.startsWith("feat ") || title.startsWith("feat(") || title.startsWith("feat:")) {
      items[1].commits.push(tpl);
    } else if (title.startsWith("fix ") || title.startsWith("fix(") || title.startsWith("fix:")) {
      items[2].commits.push(tpl);
    } else if (title.startsWith("refactor ") || title.startsWith("refactor(") || title.startsWith("refactor:")) {
      items[3].commits.push(tpl);
    } else if (title.startsWith("chore ") || title.startsWith("chore(") || title.startsWith("chore:")) {
      items[4].commits.push(tpl);
    } else if (title.startsWith("UI ") || title.startsWith("UI(") || title.startsWith("UI:")) {
      items[5].commits.push(tpl);
    } else {
      items[6].commits.push(tpl);
    }
  }
  return items;
}

async function getCommits() {
  try {
    //TODO: add a url composer to handle diffference repo and different time span.
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();
    const resp = await axios.get(
      `https://api.github.com/repos/ringcentral/integration-apps/commits?since=${startTime}&until=${endTime}`
    , {
      auth: {
        username: account.username,
        password: account.password
      }
    });
    const prs = [];
    for (const data of resp.data) {
      const sha1 = data.sha;
      console.log("sha1:", sha1);
      // Since the rate limit of search API only allows us to make up to 10 requests per minute,
      // so we sleep for 6 seconds to limit the requests
      await Util.sleep(6000);
      try{
        const prResp = await axios.get(
          `https://api.github.com/search/issues?q=${sha1}`
        , {
          auth: {
            username: account.username,
            password: account.password
          }
        });
        for (const prData of prResp.data.items) {
          prs.push(prData);
        }
      } catch(err) {
        continue;
      }
    }
    return prs;
  } catch (err) {
    console.error("Request commits error: ", err);
  }
}

async function getPullRequests() {
  const reqs = await axios.get(
    "https://api.github.com/repos/ringcentral/ringcentral-js-widgets/pulls?state=closed"
  );

  console.log("===>", reqs);
  return reqs && reqs.data;
}

async function start() {
  const prs = await getCommits();
  // const reqs = await getPullRequests();
  const report = await getDailyReport(prs);
  console.log("reports:", report);
  return sendEmail(report);
}

start();
