import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile('main.html', { root: path.join(__dirname, 'public') });
});

app.post('/save', (req, res) => {
  const stations = req.body.stations;
  const transit_lines = req.body.transit_lines;

  console.log(stations);

  console.log(transit_lines);

  res.send(201);
});

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is running. Currently listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);


