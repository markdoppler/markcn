const { app } = require('../libs/express.js');
const testService = require('../services/test.service.js');

app.get('/', (req, res) => {
    res.send(testService.helloWorld());
});