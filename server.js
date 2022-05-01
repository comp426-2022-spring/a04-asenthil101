const express = require('express')
const app = express()
const args = require('minimist')(process.argv.slice(2))

args['port', 'debug', 'log', 'help']
const debug = args.debug || process.env.debug || 'false'
const log = args.log || process.env.log || 'true'
const help = (`
server.js [options]
--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

const port = args.port || 5000;
const fs = require('fs')
const morgan = require('morgan');
// Start an app server
const server = app.listen(port, () => {
    console.group('App listening on port %PORT%'.replace('%PORT%',port))
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const db = require('./database.js')
if(log == 'false'){
const WRITESTREAM = fs.createWriteStream('accesslog', { flags: 'a' })
app.use(morgan('combined', { stream: WRITESTREAM }))
}

app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
    });
app.get('/app/flip', (req,res) => {
        res.contentType('text/json');
        res.status(200).json({'flip' : coinFlip()});
    });
app.get('/app/flips/:number', (req, res) => {
    res.contentType('text/json');
    const flips = coinFlips(req.params.number);
    const count = countFlips(flips);
    res.status(200).json({'raw':flips,'summary' : count});
});
app.get('/app/flip/call/heads', (req,res) => {
    res.contentType('text/json');
    res.status(200).json(flipACoin('heads'));
});
app.get('/app/flip/call/tails', (req,res) => {
    res.contentType('text/json');
    res.status(200).json(flipACoin('tails'));
});
// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});