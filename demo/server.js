const got = require("got");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const PORT = 4040;
let jwt_token;

const app = express();
app.use(cors());

//Serve index.html and all static files in public folder
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});
app.use(express.static("public"));

app.get("/api/jwt", async (req, res) => {

  let voicegainApiUrl = new URL("https://api.voicegain.ai/v1/security/jwt");
  const bearer = "Bearer " + process.env.JWT_TOKEN;
  const options = {
    headers: {
      Authorization: bearer,
      "Content-Type": "application/json",
    },
    searchParams: {
      aud: process.env.SERVER_URL,
      expInSec: 3600, //Enter the jwt timer here - 5 min.(300 sec) ...For now it is 3600 sec for testing purposes
    },
  };

  try {
    const jwtResponse = await got(voicegainApiUrl.toString(), options);
    jwt_token = jwtResponse.body;
    //throw new Error('Forced error throw by programmer');
    return res.send({ jwtToken: jwt_token });
  } catch (err) {
    console.log(err);
    return res.status(err.response.statusCode).send(err.response.body);
  }
});

//Captcha added part
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { stringify } = require("querystring");
const { ppid } = require("process");
const https = require("https");
const request = require("request");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));

//Get state from index.html(client) and verify with API
//It is a one time check, so if you recapture again...a new captcha response needs to be sent.

app.post("/submit", async (req, res) => {
  try{
    //throw new Error('Forced error throw by programmer');
    if (!req.body.captcha) {
      return res.json({ success: false, message: "Please select captcha" });
    }

    // Secret key
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; //Insert Secret Key here
    console.log("Server has received captcha status");
    // Verify URL
    const query = stringify({
      secret: secretKey,
      response: req.body.captcha,
      remoteip: req.connection.remoteAddress,
    });
    const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

    request(verifyURL, function (error, response, body) {
      body = JSON.parse(body); //add await function here?
      //console.log(body.success);

      // If not successful
      if (body.success !== undefined && !body.success) {
        return res.json({ success: false, message: "Failed captcha verification" });
      }
      // If successful
      if (body.success !== undefined && body.success) {
        return res.json({ success: true, message: "Captcha passed" });
      }
    });
  } catch (err) {
      console.log("statusCode: ", res.statusCode);
      console.log('Server Captcha Validation Error is : ' + err);

      err.status = res.statusCode || 404; //Sometimes invalid error statusCode is returned

      return res.status(err.status).json({
          error: {
            message: err.message,
            status: err.status
          }
      });
    }
})

app.listen(PORT);
