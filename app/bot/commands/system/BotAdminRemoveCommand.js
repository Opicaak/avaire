/** @ignore */
const Command = require('./../Command');

class BotAdminRemoveCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('bar', [], {
            usage: '<user>',
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

        let index = app.config.botAccess.indexOf(args[0]);
        if (index <= -1) {
            return app.envoyer.sendWarn(message, 'Invalid user id given, the user ID was not found in the bot administrative list');
        }

        delete app.config.botAccess[index];
        return app.envoyer.sendInfo(message, '`:botid` has been removed from the bot administrative list.', {
            botid: args[0]
        });
    }
}

module.exports = BotAdminRemoveCommand;
