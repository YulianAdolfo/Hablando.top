const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config()


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken =  process.env.TWILIO_AUTH_TOKEN;


let allowedContacts = {}
allowedContacts['3178562595'] = ''
allowedContacts['3108354178'] = ''
allowedContacts['3117981495'] = ''
allowedContacts['3207701982'] = ''

const app = express();
const PORT = 8500;
const PATH_FILES = './public'

function verifyIfContactIsAllowed(phoneNumber) {
  return allowedContacts[phoneNumber] == undefined || allowedContacts[phoneNumber] == 'undefined' ? 0 : 1
}
// Set the static files folder
app.use(express.static(path.join(__dirname, PATH_FILES)));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.use(bodyParser.json());
// Route to handle requests to "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, PATH_FILES, 'phone.html'));
});
// Getting ICED servers
app.get('/ice', async (req, res) => {
  const client = require('twilio')(accountSid, authToken);
  let STUN_SERVERS;
  await client.tokens.create().then(token => STUN_SERVERS = token.iceServers);
  res.json(STUN_SERVERS)
})
app.post('/register_phone_number', (req, res) => {
  let data = {'exits': Boolean}
  data.exits = verifyIfContactIsAllowed(req.body)
  res.json(data)
})
app.post('/update_hash', (req, res) => {
  let hash = req.body.hash
  let phone = req.body.phone
  allowedContacts[phone] = hash 
  res.json({'status': allowedContacts[phone]})
})
app.post('/getHash', (req, res) => {
  let data = {hash : ''}
  data.hash = allowedContacts[req.body]
  res.json(data)
})
const httpsServer = http.createServer(app);
// Start the server
httpsServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
