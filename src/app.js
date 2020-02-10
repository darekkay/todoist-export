const path = require("path");

const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("morgan");
const axios = require("axios");
const csvParser = require("json-2-csv");

const config = require("./config");

const oauth2 = require("simple-oauth2").create({
  client: {
    id: config.client_id,
    secret: config.client_secret
  },
  auth: {
    tokenHost: "https://todoist.com",
    tokenPath: "/oauth/access_token",
    authorizePath: "/oauth/authorize"
  },
  options: {
    authorizationMethod: "body"
  }
});

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const app = express();
const subdirectory = "/todoist-export";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.set("json spaces", 2); // prettify json output

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(subdirectory, express.static(path.join(__dirname, "..", "public")));

app.get(`${subdirectory}/`, (req, res) => {
  res.render("index", {});
});

const callApi = async (api, parameters) => {
  const response = await axios({
    method: "post",
    url: `https://todoist.com/API/v8/${api}`,
    data: parameters
  });
  return response.data;
};

const renderErrorPage = (res, message, error) => {
  res.status((error && error.status) || 500);
  res.render("error", {
    message,
    error: IS_PRODUCTION ? undefined : error
  });
};

app.post(`${subdirectory}/auth`, (req, res) => {
  const format = req.body.format; // csv vs. json

  res.redirect(
    oauth2.authorizationCode.authorizeURL({
      scope: "data:read",
      state: format
    })
  );
});

app.get(`${subdirectory}/export`, async (req, res) => {
  try {
    const authResponse = await oauth2.authorizationCode.getToken({
      code: req.query.code
    });

    const token = authResponse["access_token"];
    const format = req.query.format;

    res.redirect(`${subdirectory}?token=${token}&format=${format}`);
  } catch (error) {
    renderErrorPage(res, error);
  }
});

const escapeCommas = syncData =>
  syncData.items.map(item => ({
    ...item,
    labels: `"${item.labels.toString()}"`,
    content: `"${item.content.toString()}"`
  }));

/* Convert label IDs into their corresponding names */
const convertLabelNames = syncData => {
  const labelNames = syncData.labels.reduce(
    (acc, label) => ({ ...acc, [label.id]: label.name }),
    {}
  );

  return syncData.items.map(item => ({
    ...item,
    labels: item.labels.map(labelId => labelNames[labelId])
  }));
};

/* Convert project IDs into their corresponding names */
const convertProjectNames = syncData => {
  const projectNames = syncData.projects.reduce(
    (acc, project) => ({ ...acc, [project.id]: project.name }),
    {}
  );

  return syncData.items.map(item => ({
    ...item,
    project_id: projectNames[item.project_id]
  }));
};

/* Convert user IDs into their corresponding names */
const convertUserNames = syncData => {
  const userNames = syncData.collaborators.reduce(
    (acc, collaborator) => ({
      ...acc,
      [collaborator.id]: collaborator.full_name
    }),
    {}
  );

  return syncData.items.map(item => ({
    ...item,
    assigned_by_uid: userNames[item.assigned_by_uid] || null,
    added_by_uid: userNames[item.added_by_uid] || null,
    user_id: userNames[item.user_id] || null
  }));
};

const exportData = async (res, token, format) => {
  const syncData = await callApi("sync", {
    token: token,
    sync_token: "*",
    resource_types: '["all"]'
  });

  if (syncData === undefined) {
    console.error("Could not fetch data from Todoist.");
    return renderErrorPage(res, "Could not fetch data from Todoist.");
  }

  const completedData = await callApi("completed/get_all", { token: token });
  syncData.completed = completedData; // add completed tasks

  if (format === "json") {
    res.attachment("todoist.json");
    await res.json(syncData);
  } else if (format === "csv") {
    syncData.items = convertProjectNames(syncData);
    syncData.items = convertLabelNames(syncData);
    syncData.items = convertUserNames(syncData);
    syncData.items = escapeCommas(syncData);

    try {
      csvParser.json2csv(syncData.items, (error, csv) => {
        if (error) {
          return renderErrorPage(res, "CSV export error.", error);
        }
        res.attachment("todoist.csv");
        res.send(csv);
      });
    } catch (error) {
      return renderErrorPage(res, "CSV export error.", error);
    }
  } else {
    return renderErrorPage(res, `Unknown format: ${format}`);
  }
};

app.get(`${subdirectory}/download`, async (req, res) => {
  try {
    await exportData(res, req.query.token, req.query.format);
  } catch (error) {
    return renderErrorPage(res, error.message || "Unexpected error.", error);
  }
});

app.get("*", (req, res) => {
  res.redirect(subdirectory);
});

/* Override default express error handling*/
app.use((error, req, res, next) => {
  renderErrorPage(res, error.message, error);
});

module.exports = app;
