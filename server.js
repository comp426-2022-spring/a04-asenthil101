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

app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});
const myFunc = function(req, res, next) {
	let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next()
    // res.status(200).json(info)
};
if(debug == true){
    app.get("/app/error", (req, res) => {
        throw new Error("Error test succesful.")
    })
    app.get("/app/log/access", myFunc, (req, res) => {	
            const stmt = db.prepare('SELECT * FROM accesslog').all()
            console.log(stmt)
            res.status(200).json(stmt)
    } )

}
