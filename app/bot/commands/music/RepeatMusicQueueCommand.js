/** @ignore */
const Command = require('./../Command');
/** @ignore */
const Music = require('./MusicHandler');

class RepeatMusicQueueCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('repeatsongs', ['repeat', 'loop'], {
            allowDM: false,
            middleware: [
                'throttle.channel:2,5',
                'hasRole:DJ'
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
        if (!Music.isConnectedToVoice(message)) {
            return app.envoyer.sendWarn(message, 'commands.music.missing-connection');
        }

        if (Music.getQueue(message).length === 0) {
            return app.envoyer.sendWarn(message, 'commands.music.repeat.empty-queue');
        }

        let guildId = app.getGuildIdFrom(message);
        let status = !Music.isRepeat(guildId);

        Music.setRepeat(guildId, status);

        return app.envoyer.sendSuccess(message, 'commands.music.repeat.' + (status ? 'enabled' : 'disabled'));
    }
}

module.exports = RepeatMusicQueueCommand;
