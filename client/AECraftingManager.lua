---
--- Generated by EmmyLua(https://github.com/EmmyLua) in IntelliJ IDEA
--- Created by Will.
--- DateTime: 4/29/2021 12:36 PM
---
local component = require('component')
local term = require('term')

local gpu = component.gpu

AECraftingManager = {}
AECraftingManager.__index = AECraftingManager

function AECraftingManager:newManager(controller)
    local manager = {}
    setmetatable(manager, self)

    if not controller then
        print("A ME controller must be present to instantiate a Crafting Manager")
        return nil
    end

    manager.crafter = AECrafter:new(controller)
    manager.hasUpdate = true
    manager.log = {}
    manager.status = {}
    manager.crafting = {}
    manager.toCraft = {}

    return manager
end

function AECraftingManager:manage()
    if self:hasJobsInQueue() then
        for key, value in pairs(self.toCraft) do
            if value then
                local craftStatus = self.crafter:craft(key, value[1], value[2])
                if type(craftStatus) == 'table' then
                    self.crafting[key] = craftStatus
                    self.toCraft[key] = nil -- Dequeue job

                    local job = self.status[key]
                    job[2] = "CRAFTING"
                    self.status[key] = job
                    self.hasUpdate = true

                    self:logger(3, "Started job "..tostring(key))
                end

                if craftStatus == 'NO_AVAIL_CPU' then
                    -- Update status
                    local job = self.status[key]
                    job[2] = "WAIT"
                    self.status[key] = job
                    self.hasUpdate = true

                    self:logger(2, "Failed to initialize job for "..tostring(key).." all crafting CPUs are currently busy.")
                end

                if craftStatus == 'INIT_ERR' then
                    -- Update status
                    local job = self.status[key]
                    job[2] = "ERROR"
                    self.status[key] = job
                    self.hasUpdate = true

                    self.toCraft[key] = nil
                    self:logger(1, "Failed to bind crafter for "..tostring(key)..", please check recipe and try again!")
                    self:logger(2, "Removing job "..tostring(key).." from crafting queue")
                end
            end
        end
    end

    self:checkCraftingStatus()
end

function AECraftingManager:checkCraftingStatus()
    for key, value in pairs(self.crafting) do
        if value then
            if value.isCanceled() then
                self:logger(1, "Job request for "..tostring(key).." was cancelled by ME controller")
                self.crafting[key] = nil

                -- Update status
                local job = self.status[key]
                job[2] = "ERROR"
                self.status[key] = job
                self.hasUpdate = true
            end
            if value.isDone() then
                self:logger(3, "Completed job "..tostring(key))
                self.crafting[key] = nil

                -- Update status
                self.status[key] = nil
                self.hasUpdate = true
            end
        end
    end
end

-- Fix clashing requests
function AECraftingManager:queueCraft(item, amount, rush)
    self.toCraft[item] = {amount, rush}
    self.status[item] = {amount, "QUEUE"} -- Create Status
    self.hasUpdate = true

    self:logger(3, ("Queued job "..tostring(item)))
end

function AECraftingManager:displayJobList()
    for key, value in pairs(self.status) do
        print("Item: ".. tostring(key))
        print("Amount: ".. tostring(value))

    end
end

function AECraftingManager:logger(level, msg)
    table.insert(self.log, {level, msg})
end

function AECraftingManager:dumpLogs()
    for i = 1, #self.log do
        local message = self.log[i]
        if message[1] == 4 then
            gpu.setForeground(0x32CD32)
            term.write("[ALEXA] ")
        end
        if message[1] == 3 then
            gpu.setForeground(0xFFFFFF)
            term.write("[INFO] ")
        end

        if message[1] == 2 then
            gpu.setForeground(0xFEDE00)
            term.write("[WARN] ")
        end

        if message[1] == 1 then
            gpu.setForeground(0xDC143C)
            term.write("[ERROR] ")
        end

        gpu.setForeground(0xFFFFFF)

        local _, row = term.getCursor()
        term.setCursor(10, row)

        term.write(message[2].."\n")
    end
    self.log = {}
end

function AECraftingManager:hasJobsInQueue()
    for _,_ in pairs(self.toCraft) do
        return true
    end
    return false
end

function AECraftingManager:isCrafting()
    for _,_ in pairs(self.crafting) do
        return true
    end
    return false
end

-- Helper function returns true if there are any active jobs
function AECraftingManager:hasJobs()
    for _,_ in pairs(self.status) do
        return true
    end
    return false
end

function AECraftingManager:getUpdateFlagStatus()
    return self.hasUpdate
end

function AECraftingManager:resetUpdateFlag()
    self.hasUpdate = false
end
