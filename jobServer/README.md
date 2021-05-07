The job server is a translation layer between the Lambda function running the Alexa voice recognition code and Minecraft. 
Here is where all the queued jobs are held until the ingame client requests the job list.  

The server requires the following dependencies to run:
- Express.js (duh)
- node-json-db

node-json-db is used so I can easily map ingame UUIDs to the Alexa/human friendly name.
I figured that MongoDB would be overkill for this project and for what I need both are quite fast.
