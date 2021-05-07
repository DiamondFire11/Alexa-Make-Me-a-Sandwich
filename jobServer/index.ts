import express = require("express");
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

const app = express();
const port: number = 3000;

let controllerDB = new JsonDB(new Config("controllerDB", true, true, '/'));

// Send recipe db to game
app.get("/queue", (req, res) => {
    const name: string = req.query.name;
    const amount: number = parseInt(req.query.amount);
    const item: string = req.query.item;

    res.send(queueJob(name, amount, item));
});

// Send recipe db to game
app.get("/get", (req, res) => {
    const uuid: string = req.query.uuid;

    res.send(getJobs(uuid))
});

app.get("/new", (req, res) => {
    const uuid: string = req.query.uuid;
    const name: string = req.query.name;

    res.send(registerUUID(name, uuid))
})


app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
});

// Registers UUID and Name in database
function registerUUID(name: string, uuid: string){
    try{
        if (controllerDB.getIndex("/controllers", uuid, "uuid") != -1 || controllerDB.getIndex("/controllers", name, "name") != -1){
            console.log(`Cannot register ${uuid} for that UUID already exists.`)
            return `REGISTRATION_ERROR`;
        }

        controllerDB.push(`/controllers[]/`, {uuid: uuid, name: name, recipes: []});
        console.log(`Registered controller ${uuid}`);
        return `Registered controller ${uuid}`;
    }catch (e) {
        console.log("Error accessing DB");
        return null
    }
}

// Appends new job to bottom of job queue
function queueJob(name: string, amount: number, item: string){
    const index: number = controllerDB.getIndex("/controllers", name, "name");

    if (index != -1){
        controllerDB.push(`/controllers[${index}]/recipes[]`, {item: item, amount: amount});
        console.log(`Queued job for ${name} requesting ${amount} of ${item}`)
        return "SUCCESS";
    }
    return "FAILURE";
}

// Gets the current job list from the database
function getJobs(uuid: string){
    try {
        const index: number = controllerDB.getIndex("/controllers", uuid, "uuid");

        if(index == -1){
            console.log(`Could not find controller with UUID ${uuid}`);
            return null;
        }

        console.log(`Sending recipes to ${uuid}`);
        const recipes: object = controllerDB.getData(`/controllers[${index}]/recipes`); //Send job queue to game
        controllerDB.push(`/controllers[${index}]/recipes`, []); //Clear job queue
        return recipes;
    }catch(e) {
        console.log(`Error accessing DB`);
        return null;
    }
}
