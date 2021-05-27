"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var node_json_db_1 = require("node-json-db");
var JsonDBConfig_1 = require("node-json-db/dist/lib/JsonDBConfig");
var app = express();
var port = 3000;
var controllerDB = new node_json_db_1.JsonDB(new JsonDBConfig_1.Config("controllerDB", true, true, '/'));
// Send recipe db to game
app.get("/queue", function (req, res) {
    var job = {
        "controller": req.query.name,
        "amount": parseInt(req.query.amount),
        "item": req.query.item,
        "status": false
    };
    res.setHeader('Content-Type', 'application/json');
    // @ts-ignore
    job.status = queueJob(job.controller, job.amount, job.item);
    res.end(JSON.stringify(job));
});
// Send recipe db to game
app.get("/get", function (req, res) {
    var uuid = req.query.uuid;
    res.send(getJobs(uuid));
});
app.get("/new", function (req, res) {
    var uuid = req.query.uuid;
    var name = req.query.name;
    res.send(registerUUID(name, uuid));
});
app.listen(port, function () {
    console.log("Server started at http://localhost:" + port);
});
// Registers UUID and Name in database
function registerUUID(name, uuid) {
    try {
        if (controllerDB.getIndex("/controllers", uuid, "uuid") != -1 || controllerDB.getIndex("/controllers", name, "name") != -1) {
            console.log("Cannot register " + uuid + " for that UUID already exists.");
            return "REGISTRATION_ERROR";
        }
        controllerDB.push("/controllers[]/", { uuid: uuid, name: name, recipes: [] });
        console.log("Registered controller " + uuid);
        return "Registered controller " + uuid;
    }
    catch (e) {
        console.log("Error accessing DB");
        return null;
    }
}
// Appends new job to bottom of job queue
function queueJob(name, amount, item) {
    var index = controllerDB.getIndex("/controllers", name, "name");
    item = fixCapitalization(item);
    if (index != -1) {
        var uuid = controllerDB.getData("/controllers[" + index + "]/uuid"); //Send job queue to game
        controllerDB.push("/controllers[" + index + "]/recipes[]", { item: item, amount: amount });
        console.log("Queued job for " + uuid + " requesting " + amount + " of " + item);
        return true;
    }
    return false;
}
// Gets the current job list from the database
function getJobs(uuid) {
    try {
        var index = controllerDB.getIndex("/controllers", uuid, "uuid");
        if (index == -1) {
            console.log("Could not find controller with UUID " + uuid);
            return null;
        }
        console.log("Sending recipes to " + uuid);
        var recipes = controllerDB.getData("/controllers[" + index + "]/recipes"); //Send job queue to game
        controllerDB.push("/controllers[" + index + "]/recipes", []); //Clear job queue
        return recipes;
    }
    catch (e) {
        console.log("Error accessing DB");
        return null;
    }
}
// Fix the capitalization of the item so the game can queue the proper recipe
function fixCapitalization(str) {
    var item = "";
    var iterator = 0;
    var words = str.split(' ');
    var filter = ["and", "of"];
    words.forEach(function (word) {
        if (!filter.includes(word)) {
            item += word.charAt(0).toUpperCase() + word.slice(1);
        }
        else {
            item += word;
        }
        ++iterator;
        if (iterator <= words.length - 1) {
            item += " ";
        }
    });
    return item;
}
