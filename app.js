var config = require('./config');

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var csv = require('json-2-csv');

var oauth2 = require('simple-oauth2')({
    clientID: config.client_id,
    clientSecret: config.client_secret,
    site: 'https://todoist.com',
    tokenPath: '/oauth/access_token',
    authorizationPath: '/oauth/authorize'
});

process.env['NODE_ENV'] = 'production';

var app = express();
var subdirectory = "/todoist-export";

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('json spaces', 2); // prettify json output

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(subdirectory, express.static(path.join(__dirname, 'public')));

app.get(subdirectory + '/', (req, res) => {
    res.render('index', {});
});

function call(api, parameters, callback) {
    request.post({
        url: "https://todoist.com/API/v7/" + api,
        form: parameters,
        json: true
    }, callback)
}

function sendError(res, message) {
    res.render("error", {
        message: message
    });
}

app.post(subdirectory + "/auth", (req, res) => {

  var format = req.body.format; // csv vs. json

  res.redirect(oauth2.authCode.authorizeURL({
    scope: 'data:read',
    state: format
  }));
});

app.get(subdirectory + '/export', (req, res) => {
  var code = req.query.code;

  oauth2.authCode.getToken({
    code: code
  }, (err, result) => {

    if (err) return sendError(res, err);

    var token = result["access_token"];
    var format = req.query.format;

    exportData(res, token, format);
  });
});

function exportData(res, token, format) {

  call('sync', {
    token: token,
    sync_token: '*',
    resource_types: '["all"]'
  }, (err, http, syncData) => {

    if (err) return sendError(res, err);

    call('completed/get_all', {token: token}, (err, http, completedData) => {

      if (err) return sendError(res, err);

      syncData.completed = completedData; // add completed tasks

      if(format === 'json') {
        res.attachment("todoist.json");
        res.json(syncData);
      }

      else if (format === 'csv') {
        try {
          csv.json2csv(replaceCommas(syncData.items), (err, csv) => {
            if (err) {
              return sendError(res, "CSV export error.");
            }
            res.attachment("todoist.csv");
            res.send(csv);
          });
        }
        catch(err){
          return sendError(res, "CSV export error.");
        }
      }

      else {
        return sendError(res, "Unknown format: " + format);
      }
    });

  });

}

function replaceCommas(items) {

    // TODO: convert label ids to names
    for (var key in items) {
        if (items.hasOwnProperty(key)) {
            var item = items[key];
            // surround columns containing comma values with quotes
            item["labels"] = '"' + item["labels"].toString() + '"';
            item["content"] = '"' + item["content"].toString() + '"';
        }
    }
    return items;
}

app.get('*', function (req, res) {
    res.redirect(subdirectory);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message
    });
});

module.exports = app;
