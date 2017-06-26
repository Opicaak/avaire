/** @ignore */
const request = require('request');
/** @ignore */
const Command = require('./../Command');

class ChuckNorrisCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('chucknorris', ['chuck', 'norris'], {
            middleware: [
                'throttle.channel:1,1'
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
        request('http://api.icndb.com/jokes/random?escape=javascript', (error, response, body) => {
            if (!error && response.statusCode === 200) {
                try {
                    let parsed = JSON.parse(body);

                    return app.envoyer.sendSuccess(message, `<@:userid> ${parsed.value.joke}`);
                } catch (err) {
                    app.logger.error(err);
                    return app.envoyer.sendError(message, 'The API returned an unconventional response.');
                }
            }
        });
    }
}

module.exports = ChuckNorrisCommand;
