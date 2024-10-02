import { addDb } from './db.js';
import { logMessage } from '../../libs/chalk.js';
import { addService } from './service.js';
import { addController } from './controller.js';
import { addMongooseModel } from './model.js';

function addCommand(module) {

    const commands = {
        db: addDb,
        service: addService,
        controller: addController,
        model: addMongooseModel
    }

    console.log(`Ejecuting add command for module "${module}"...`);

    if (commands[module]) {
        commands[module]();
    } else {
        logMessage(`The module "${module}" is not available.`, 'error');
    }
        

}

export default addCommand;
