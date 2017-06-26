/** @ignore */
const Command = require('./../Command');

class UptimeCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('uptime', [], {
            middleware: [
                'throttle.user:1,2'
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
        return app.envoyer.sendInfo(message, 'I have been up for ' + app.process.getUptime(false));
    }
}

module.exports = UptimeCommand;
