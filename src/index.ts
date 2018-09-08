import axios from "axios";
import * as nodemailer from "nodemailer";
import { pathOr } from "ramda";
import { config } from "./config";
import { env } from "./env";
import * as Util from "./util";
import { PassThrough } from "stream";

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
  // UI_CHANGE,
  BUGFIX,
  REFACTOR,
  TOOLING,
  OTHER
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
    // case UI_CHANGE:
    //   return "** :boom: UI Change **";
    case BUGFIX:
      return "** :white_check_mark: Bugfix **";
    case REFACTOR:
      return "** :first_place: Refactor **";
    case TOOLING:
      return "** :atom: Tooling **";
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
    if (item.commits.length > 0) {
      tpl.push(typeTpl);
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
    const { title, number } = pr;
    const tpl = `* ${title} ([#${number}](https://github.com/ringcentral/ringcentral-js-widgets/pull/${number}))`;

    if (title.includes("break ") || title.includes("break(")) {
      items[0].commits.push(tpl);
    } else if (title.includes("feat ") || title.includes("feat(")) {
      items[1].commits.push(tpl);
    } else if (title.includes("fix ") || title.includes("fix(")) {
      items[2].commits.push(tpl);
    } else if (title.includes("refactor ") || title.includes("refactor(")) {
      items[3].commits.push(tpl);
    } else if (title.includes("chore ") || title.includes("chore(")) {
      items[4].commits.push(tpl);
    } else {
      items[5].commits.push(tpl);
    }
  }
  return items;
}

async function getCommits() {
  try {
    //TODO: add a url composer to handle diffference repo and different time span.
    const resp = await axios.get(
      "https://api.github.com/repos/ringcentral/ringcentral-js-widgets/commits?since=2013-08-31T00:02:00+00:00&until=2018-09-05T00:02:00+00:00"
    );
    const prs = [];
    for (const data of resp.data) {
      const sha1 = data.sha;
      console.log("sha1:", sha1);
      await Util.sleep(200);
      const prResp = await axios.get(
        `https://api.github.com/search/issues?q=${sha1}`
      );
      for (const prData of prResp.data.items) {
        prs.push(prData);
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
  // const prs = await getCommits();
  const reqs = await getPullRequests();
  const report = await getDailyReport(reqs);
  console.log("reports:", report);
  return sendEmail(report);
}

start();
