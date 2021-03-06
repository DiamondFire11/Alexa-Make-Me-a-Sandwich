---
--- Generated by EmmyLua(https://github.com/EmmyLua) in IntelliJ IDEA
--- Created by Will.
--- DateTime: 4/28/2021 9:47 AM
---

local component = require('component')
local term = require('term')
local internet = require("internet")
local uuid = require("uuid")
local json = require("json")
local shell = require("shell")

-- Bind ME Controller interface
local me = component.me_controller
local gpu = component.gpu

-- Run APIs to load from filesystem
os.execute("map.lua")
os.execute("uiManager.lua")
os.execute("AECrafter.lua")
os.execute("AECraftingManager.lua")

function main()
    term.clear()

    local manager = AECraftingManager:newManager(me)
    local config = loadConfigs(manager)

    local jobs = getJobsFromAPI(manager, config)
    queueJobs(manager, jobs)

    while true do
        manager:manage()

        if manager:getUpdateFlagStatus() then
            updateUI(manager)
            manager:resetUpdateFlag()
        end

        os.sleep(5)

        -- Ask server for new tasks
        jobs = getJobsFromAPI(manager, config)
        queueJobs(manager, jobs)
    end

    gpu.setResolution(160,50)
end

function queueJobs(manager, data)
    if data and data ~= "" then
        map(json.decode(data), function(item)
            manager:logger(4, "New incoming crafting request from Amazon Alexa!")
            manager:queueCraft(item.item, item.amount, false)
        end)
    end
end

-- Contacts Node.js server for pending jobs
function getJobsFromAPI(manager, config)
    local url = "http://diamondfire11.ngrok.io/get?uuid="..tostring(config.uuid)
    local data = contactServer(url)

    if data ~= "" then
        return data
    else
        manager:logger(1, "Failed to contact job server!")
    end
end

-- Registers controller with Node.js server
function registerController(name, id)
    local url = "http://diamondfire11.ngrok.io/new?uuid="..tostring(id).."&name="..tostring(name)
    local data = contactServer(url)

    if data == "REGISTRATION_ERROR" then
        print("Name or UUID already in use!")
        return false
    end

    if data ~= "" then
        return true
    else
        print("Unable to contact job server!")
        return false
    end
end

-- Handles communication with Node.js and the game.  Made to condense code
function contactServer(url)
    local handle = internet.request(url)

    if handle then
        local body = ""

        pcall(function()
            for chunk in handle do
                body = body .. chunk
            end
        end)

        return body
    else
        return nil
    end
end

function loadConfigs(manager)
    local config = io.open("config.json", "r")

    if not config then
        local name
        local id = uuid.next()

        print("Config file not found, creating")
        config = io.open("config.json", "w")
        print("Enter name of controller")
        name = io.read()

        local jsonObj = json.encode({uuid = id, name = name})
        config:write(jsonObj)
        config:close()

        local isRegistered = registerController(name, id)

        if isRegistered == false then
            shell.execute("rm config.json")
            print("Config file not generated.  Re-run program to try again")
        else
            print("Config file generated.  Re-run program to start manager")
        end

        os.exit()

    else
        local confData = config:read()
        local data = json.decode(confData)
        manager:logger(2, "Successfully loaded config data!")
        manager:logger(2, "NAME: "..tostring(data.name))
        manager:logger(2, "UUID: "..tostring(data.uuid))

        return data
        end
end

main()
