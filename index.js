/* eslint-env node */

'use strict';

const HOST = 'localhost';
const PORT = 8080;

const path    = require('path');
const express = require('express');
const app     = express();

app.use(express.static(path.join(__dirname, '/out')));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, `/out/index.html`)); });
app.listen(PORT);

console.log(`Development server started at http://${HOST}:${PORT}`);
