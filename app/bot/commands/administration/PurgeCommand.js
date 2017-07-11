/** @ignore */
const _ = require('lodash');
/** @ignore */
const moment = require('moment');
/** @ignore */
const Command = require('./../Command');

/**
 * Purge Command, allows users with the right permissions to
 * delete messages that was sent within the last two weeks.
 *
 * @extends {Command}
 */
class PurgeCommand extends Command {

    /**
     * Sets up the command by providing the prefix, command trigger, any
     * aliases the command might have and additional options that
     * might be usfull for the abstract command class.
     */
    constructor() {
        super('purge', ['clear'], {
            allowDM: false,
            usage: [
                '<amount> [@tagedUser]'
            ],
            middleware: [
                'throttle.channel:1,5',
                'require:text.manage_messages'
            ]
        });

        /**
         * The amount of milliseconds in 14 days.
         *
         * @type {Number}
         */
        this.fourteenDays = 1000 * 60 * 60 * 24 * 14;
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

        let amount = Math.min(Math.max(parseInt(args[0], 10), 1) + 1, 1000);

        // If no users was tagged in the command we'll just process the deleted messages
        // without any filter, this will delete all the messages that can be fetched
        // from the Discord API within the message amount limit given.
        if (message.mentions.length === 0) {
            let promise = this.deleteMessages(message.channel, amount, messages => {
                return _.filter(messages, message => {
                    return !this.is14DaysOld(message.timestamp);
                });
            });

            return this.processDeletedMessages(promise, message, 'commands.administration.purge.all-messages');
        }

        let mentions = message.mentions;
        let users = [];

        for (let i = 0; i < mentions.length; i++) {
            users.push(`${mentions[i].username}#${mentions[i].discriminator}`);
        }

        return this.processDeletedMessages(this.deleteMessages(message.channel, amount, messages => {
            return _.filter(messages, message => {
                if (this.is14DaysOld(message.timestamp)) {
                    return false;
                }

                let authorId = message.author.id;
                for (let i = 0; i < mentions.length; i++) {
                    if (mentions[i].id === authorId) {
                        return true;
                    }
                }

                return false;
            });
        }), message, 'commands.administration.purge.user-messages', {users});
    }

    /**
     * Process deleted messages, sending the "x messages has been deleted"  message
     * if successfully, if something went wrong we'll let the user know as well.
     *
     * @param  {Promise}   promise         The promise that handeled deleting the messages.
     * @param  {IMessage}  message         The Discordie message object.
     * @param  {String}    languageString  The language string that should be sent to the user if it was successfully.
     * @param  {Object}    placeholders    The placeholders for the message.
     * @return {Promise}
     */
    processDeletedMessages(promise, message, languageString, placeholders = {}) {
        return promise.then(stats => {
            placeholders.amount = stats.deletedMessages;
            placeholders.skiped = stats.skipedMessages;

            // Sends the deleted messages confirmation message from the language files
            // and starts and delayed taks to delete the message after 3½ seconds.
            return app.envoyer.sendSuccess(message, languageString, placeholders).then(message => {
                return app.scheduler.scheduleDelayedTask(() => {
                    return app.envoyer.delete(message);
                }, 3500);
            });
        }).catch(err => {
            app.logger.error(err);
            return app.envoyer.sendWarn(message, ':warning: ' + err.response.res.body.message);
        });
    }

    /**
     * Delete the list of messages given, if more than 100 messages
     * is given the method will call itself with the next set of
     * messages until it has deleted all of the messages.
     *
     * @param  {ITextChannel}  channel  The channel the messages should be deleted in.
     * @param  {Number }       left     The number of messages there are left to be deleted
     * @param  {Function}      filter   The filter that separates messages that should and shouldn't be deleted.
     * @param  {Object}        stats    Number of messages that has been deleted.
     * @return {Promise}
     */
    deleteMessages(channel, left, filter = null, stats = null) {
        if (stats === null) {
            stats = {
                deletedMessages: 0,
                skipedMessages: 0
            };
        }
        return channel.fetchMessages(Math.min(left, 100)).then(result => {
            // If the filter variable is a callback and the list of messages isn't undefined
            // we'll parse in the messages from the Discord API request to filter them
            // down so we're left with only the messages matching our filter.
            if (typeof filter === 'function' && typeof result.messages !== 'undefined') {
                let before = result.messages.length;

                result.messages = filter(result.messages);
                stats.skipedMessages += before - result.messages.length;
            }

            // If the messages length is 1 or lower we'll end the loop and send back the amount of deleted messages
            // since the only message in the fetch request would be the message that triggered the command.
            if (result.messages.length < 2) {
                return stats;
            }

            return bot.Messages.deleteMessages(result.messages).then(() => {
                stats.deletedMessages += result.messages.length;

                // Checks to see if we have more messages that needs to be deleted, and if the result from
                // the last request to the Discord API returned less then what we requested for, if
                // that is the case we can assume the channel doesn't have anymore messages.
                if (left > 100 && result.limit === 100 && result.limit === result.messages.length) {
                    return this.deleteMessages(channel, left - 100, filter, stats);
                }

                return stats;
            });
        });
    }

    /**
     * Check if the given timestamp is older than 14 days.
     *
     * @param  {String}  timestamp  The message timestamp that should be checked.
     * @return {Boolean}
     */
    is14DaysOld(timestamp) {
        return (moment(timestamp).diff(new Date) * -1) > this.fourteenDays;
    }
}

module.exports = PurgeCommand;
