/** @ignore */
const _ = require('lodash');
/** @ignore */
const Command = require('./../Command');
/** @ignore */
const categories = require('./../Categories');
/** @ignore */
const Moddules = require('./../Modules');

class ModuleEnableCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('me', [], {
            usage: '<module>',
            middleware: [
                'isBotAdmin'
            ]
        });
    }

    /**
     * Executes the given command.
     *
     * @param  {IUser}     sender   The Discordie user object that ran the command.
     * @param  {IMessage}  message  The Discordie message object that triggered the command.
     * @param  {Array}     args     The arguments that was parsed to the command.
     * @return {mixed}
     */
    onCommand(sender, message, args) {
        if (args.length === 0) {
            return this.sendMissingArguments(message);
        }

        let category = categories.find(category => {
            return _.startsWith(category.name.toLowerCase(), args[0].toLowerCase());
        });

        if (typeof category === 'undefined') {
            return app.envoyer.sendWarn(message, 'Invalid module given, `:category` is not a valid module', {
                category: args[0]
            });
        }

        Moddules.setStatues(category.name.toLowerCase(), true);

        return app.envoyer.sendSuccess(message, 'The `:category` module is now `enabled`.', {
            category: category.name
        });
    }
}

module.exports = ModuleEnableCommand;
