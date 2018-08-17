import axios from "axios";
import * as nodemailer from "nodemailer";
import { pathOr } from "ramda";
import { config } from "./config";
import { env } from "./env";
import * as Util from "./util";
import { PassThrough } from "stream";

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
  UI_CHANGE,
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
    case UI_CHANGE:
      return "** :boom: UI Change **";
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
function getDailyReport(pullRequests: any) {
  if (!pullRequests) {
    return;
  }

  const items = types.map(type => ({ type, commits: [] }));
  for (const [i, pr] of pullRequests.entries()) {
    const { title, number } = pr;
    const tpl = `* ${title} ([#${number}](https://github.com/ringcentral/ringcentral-js-widgets/pull/${number}))`;
    items[i % items.length].commits.push(tpl);
  }
  const tpl = ["** Commits daily report on 06/12/2018 Tuesday **"];
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

async function getCommits() {
  try {
    //TODO: add a url composer to handle diffference repo and different time span.
    const resp = await axios.get(
      "https://api.github.com/repos/ringcentral/ringcentral-js-widgets/commits?since=2018-8-9T00:00:00Z&until=2018-08-14T:00:00Z"
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

async function start() {
  const prs = await getCommits();
  const report = await getDailyReport(prs);
  console.log("reports:", report);
  return sendEmail(report);
}

start();
