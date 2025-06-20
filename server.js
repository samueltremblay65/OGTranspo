const express = require('express'); 
const app = express(); 
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile('main.html', {root: __dirname}); 
});

app.listen(port, function() {
    console.log('Listening to port:  ' + port);
});