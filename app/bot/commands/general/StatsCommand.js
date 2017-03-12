/** @ignore */
const Command = require('./../Command');

class StatsCommand extends Command {
    constructor() {
        super('!', 'stats', [], {
            middleware: [
                'throttle.channel:1,5'
            ]
        });
    }

    onCommand(sender, message, args) {
        let members = this.getMemberStats();
        let channels = this.getChannelStats();
        let author = bot.Users.find(user => {
            return user.id === '88739639380172800';
        });
        let description = 'Created by Senither#8023 using the Discordie framework!';

        if (app.cache.has('github.commits')) {
            description = '**Latest changes:**\n';

            app.cache.get('github.commits').slice(0, 3).forEach(commit => {
                let message = commit.commit.message.split('\n')[0];
                description += `[\`${commit.sha.substr(0, 7)}\`](${commit.html_url}) ${message}\n`;
            });
        }

        message.channel.sendMessage('', false, {
            timestamp: new Date,
            color: 0x3498db,
            url: 'https://discordapp.com/invite/gt2FWER',
            title: 'Official Bot Server Invite',
            description: description.trim(),
            author: {
                icon_url: `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=256`,
                name: `${author.username}#${author.discriminator}`
            },
            fields: [
                {
                    name: 'Members',
                    value: [
                        members.totalMembers + ' Total',
                        members.totalOnline + ' Online',
                        members.uniqueMembers + ' Unique',
                        members.uniqueOnline + ' Unique online'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Channels',
                    value: [
                        channels.totalChannels + ' Total',
                        channels.textChannels + ' Text',
                        channels.voiceChannels + ' Voice'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: 'Uptime',
                    value: this.getProcessUptime(),
                    inline: true
                },
                {
                    name: 'Servers',
                    value: bot.Guilds.length,
                    inline: true
                },
                {
                    name: 'Commands Run',
                    value: app.bot.statistics.commands,
                    inline: true
                },
                {
                    name: 'Memory Usage',
                    value: this.getSystemMemoryUsage(),
                    inline: true
                }
            ],
            footer: {
                text: `Created using NodeJS and the Discordie framework`
            }
        });
    }

    getChannelStats() {
        return app.cache.remember('bot.stats.channels', 60, () => {
            let channels = bot.Channels.toArray();
            let textChannels = channels.reduce((a, channel) => {
                return (channel.constructor.name === 'ITextChannel') ? a + 1 : a;
            }, 0);

            return {
                totalChannels: channels.length,
                textChannels: textChannels,
                voiceChannels: channels.length - textChannels
            };
        });
    }

    getMemberStats() {
        return app.cache.remember('bot.stats.members', 60, () => {
            let guildMembers = bot.Guilds.map(guild => {
                return guild.members;
            });

            return {
                totalMembers: guildMembers.reduce((a, b) => {
                    return a + b.length;
                }, 0),
                totalOnline: guildMembers.reduce((a, b) => {
                    return a + b.reduce((c, member) => {
                        return (member.status === 'offline') ? c : c + 1;
                    }, 0);
                }, 0),

                uniqueMembers: bot.Users.length,
                uniqueOnline: bot.Users.toArray().reduce((a, member) => {
                    return (member.status === 'offline') ? a : a + 1;
                }, 0)
            };
        });
    }

    getProcessUptime() {
        let seconds = process.uptime();

        let d = Math.floor(seconds / 86400);
        let h = Math.floor((seconds % 86400) / 3600);
        let m = Math.floor(((seconds % 86400) % 3600) / 60);
        let s = Math.floor(((seconds % 86400) % 3600) % 60);

        if (d > 0) {
            return `${d}d ${h}h ${m}m ${s}s`;
        }

        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        }

        if (m > 0) {
            return `${m}m ${s}s`;
        }

        return `${s}s`;
    }

    getSystemMemoryUsage() {
        let memoryInBytes = process.memoryUsage().heapTotal - process.memoryUsage().heapUsed;
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        let k = 1000;
        let i = Math.floor(Math.log(memoryInBytes) / Math.log(k));

        return parseFloat((memoryInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = StatsCommand;
