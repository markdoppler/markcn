import { app } from "../libs/express.js";
import testService from "../services/test.service.js";

app.get('/', (req, res) => {
    res.send(testService.helloWorld());
});