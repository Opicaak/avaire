/** @ignore */
const Knex = require('knex');
/** @ignore */
let Cache = null;
/** @ignore */
const GuildTransformer = require('./transformers/GuildTransformer');

/**
 * Database manager class, this class allows you to interact with
 * different database types as well as fetching guild, channel
 * and user data easily from the database.
 *
 * @see http://knexjs.org/
 */
class Database {

    /**
     * Setups the Knex database instance of the
     * provided type from the config.json file.
     */
    constructor() {
        Cache = app.cache.resolveAdapter('memory');

        /**
         * The Knex client database instance.
         *
         * @type {Knex}
         */
        this.client = new Knex({
            client: app.config.database.type,
            connection: app.config.database,
            pool: {
                min: 2,
                max: 18
            },
            migrations: {
                tableName: 'migrations',
                directory: './app/database/migrations'
            }
        });
    }

    /**
     * Runs the database migrations.
     *
     * @return {Promise}
     */
    runMigrations() {
        return new Promise((resolve, reject) => {
            this.getClient().migrate.latest().then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Gets the Knex database client instance.
     *
     * @return {Knex}
     */
    getClient() {
        return this.client;
    }

    /**
     * Gets the guild with the provided id.
     *
     * @param  {String}  guildId    The id of the guild that should fetched.
     * @param  {Boolean} skipCache  Determines if the cache should be used if is valid.
     * @return {Promise}
     */
    getGuild(guildId, skipCache = false) {
        let token = `database.${guildId}`;

        // If we shouldn't skip the cache and the cache already has a version of the guild
        // stored, we'll just fetch that and return it without hitting the database.
        if (!skipCache && Cache.has(token)) {
            return new Promise(resolve => {
                resolve(Cache.get(token));
            });
        }

        // Sets up the promise and fetches the database guild record from the database.
        return new Promise((resolve, reject) => {
            let guild = bot.Guilds.find(item => item.id === guildId);
            if (typeof guild === 'undefined') {
                return reject(new Error(`Faild to find a guild the bot is connected to with an ID of ${guildId}`));
            }

            // If we don't have the guilds data stored in the cache we'll create a temporary fake guild
            // cache so any requests for the guild that might come in right after won't attempt to
            // create multiple rows if the guild doesn't already have a row in the database.
            if (!Cache.has(token)) {
                this.fakeGuildData(token, guild.id, guild.owner_id, guild.name);
            }

            this.getClient().select().from(app.constants.GUILD_TABLE_NAME)
                .where('id', guildId)
                .then(response => {
                    app.bot.statistics.databaseQueries++;

                    // If the query didn't return any valid data we'll try and find the guild in
                    // the list of guilds that Ava is connected to and setup a default guild
                    // transformer, as well as inserting a new record into the database
                    // so we can find the guild on the next call to the database.
                    if (response.length <= 0) {
                        // Sets up our default guild transformer and stores it in the cache for 5 minutes.
                        Cache.put(token, new GuildTransformer({
                            id: guild.id,
                            owner: guild.owner_id,
                            name: guild.name
                        }), 500);

                        this.insert(app.constants.GUILD_TABLE_NAME, {
                            id: guild.id,
                            owner: guild.owner_id,
                            name: guild.name
                        });
                    } else {
                        Cache.put(token, new GuildTransformer(response[0]), 500);
                    }

                    // Resolves the guild transformer from the cache.
                    resolve(Cache.get(token));
                }).catch(err => {
                    return reject(err);
                }
            );
        });
    }

    /**
     * Inserts a new record into the provided table with the provided fields,
     * if timestamps is set to true a created_at and updated_at field will
     * be added to the fields object with the current date as their value.
     *
     * @param  {String}  table       The name of the table the record should be inserted into.
     * @param  {Object}  fields      The fields that should populate the row.
     * @param  {Boolean} timestamps  Determines if the record uses timestamps, defaults to true.
     */
    insert(table, fields, timestamps = true) {
        if (timestamps) {
            fields.created_at = new Date;
            fields.updated_at = new Date;
        }

        this.getClient().insert(fields).into(table)
            .then(() => {
                app.bot.statistics.databaseQueries++;
            }).catch(err => {
                app.logger.error(err);
            });
    }

    /**
     * Updates an existing record in the database that satisfies the
     * provided condition, if no condition is given every record
     * in the database will be updated to the new values.
     *
     * @param  {String}  table       The name of the table that holds the database records.
     * @param  {Object}  fields      The fields that should be updated in the database records.
     * @param  {Closure} condition   The closure that should limit the query.
     * @param  {Boolean} timestamps  Determins if the record uses timestatmps, defaults to true.
     */
    update(table, fields, condition, timestamps = true) {
        return new Promise((resolve, reject) => {
            if (timestamps) {
                fields.updated_at = new Date;
            }

            let query = this.getClient().table(table).update(fields);
            if (typeof condition === 'function') {
                query = condition(query);
            }

            return query.then(() => {
                return resolve(app.bot.statistics.databaseQueries++);
            }).catch(err => app.logger.error(err));
        });
    }

    /**
     * Creates a temporary fake guild data cache, lasting for 5 seconds.
     *
     * @param  {String}  token  The token that the cache should be stored under.
     * @param  {String}  id     The ID of the guild.
     * @param  {String}  owner  The ID of the owner of the guild.
     * @param  {String}  name   The name of the guild.
     * @return {Boolean}
     */
    fakeGuildData(token, id, owner, name) {
        return Cache.put(token, new GuildTransformer({
            id, owner, name
        }), 5);
    }
}

module.exports = Database;
