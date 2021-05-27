import express = require("express");
import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig'

const app = express();
const port: number = 3000;

let controllerDB = new JsonDB(new Config("controllerDB", true, true, '/'));

// Send recipe db to game
app.get("/queue", (req, res) => {
    const job: object = {
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
function registerUUID(name: string, uuid: string): string{
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
function queueJob(name: string, amount: number, item: string): boolean{
    const index: number = controllerDB.getIndex("/controllers", name, "name");

    item = fixCapitalization(item);
    if (index != -1){
        const uuid: string = controllerDB.getData(`/controllers[${index}]/uuid`); //Send job queue to game
        controllerDB.push(`/controllers[${index}]/recipes[]`, {item: item, amount: amount});
        console.log(`Queued job for ${uuid} requesting ${amount} of ${item}`)
        return true;
    }
    return false;
}

// Gets the current job list from the database
function getJobs(uuid: string): object{
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

// Fix the capitalization of the item so the game can queue the proper recipe
function fixCapitalization(str: string): string {
    let item = "";
    let iterator = 0;
    const words = str.split(' ');
    const filter = ["and", "of"];
    words.forEach(word => {
        if(!filter.includes(word)){
            item += word.charAt(0).toUpperCase() + word.slice(1);
        }else{
            item += word;
        }

        ++iterator;

        if(iterator <= words.length - 1){
            item += " ";
        }
    });

    return item;
}
