import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile('main.html', { root: path.join(__dirname, 'public') });
});

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is running. Currently listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
