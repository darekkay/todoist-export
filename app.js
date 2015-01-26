var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var csv = require('json-2-csv');

process.env['NODE_ENV'] = 'production';

var app = express();
var subdirectory = "/todoist-export";

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(subdirectory, express.static(path.join(__dirname, 'public')));

app.get(subdirectory + '/', function (req, res) {
    res.render('index', {});
});

function call(api, parameters, callback) {
    request.post({
        url: "https://api.todoist.com/" + api,
        form: parameters,
        json: true
    }, callback)
}

function sendError(res, message) {
    res.render("error", {
        message: message
    });
}

app.post(subdirectory + "/export", function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var exportAll = req.body.export === "all";
    var formatCsv = !exportAll && req.body.format === "csv";

    call("API/login", {email: email, password: password}, function (err, httpResponse, body) {

        if (body === "LOGIN_ERROR") {
            sendError(res, "Incorrect email or password");
            return;
        }

        var token = body["api_token"];
        if (token === undefined) {
            sendError(res, "Couldn't get API token");
            return;
        }

        call("TodoistSync/v5.3/get", {api_token: token, seq_no: 0}, function (err, httpResponse, body) {

            if (formatCsv) {
                csv.json2csv(replaceLabels(body.Items), function (err, csv) {
                    if (err) {
                        sendError(res, "CSV export error.");
                        //TODO: log error
                        return;
                    }
                    res.attachment("todoist.csv");
                    res.send(csv);
                });
            }
            else {
                res.attachment("todoist.json");
                var output = exportAll ? body : body.Items;
                res.json(output);
            }
        });
    });
});

function replaceLabels(items) {

    // TODO: convert label ids to names
    for (var key in items) {
        if (items.hasOwnProperty(key)) {
            var item = items[key];
            // workaround for comma separated values withing csv
            item["labels"] = '"' + item["labels"].toString() + '"';
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