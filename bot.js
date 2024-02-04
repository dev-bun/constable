const { Client, Intents, Collection } = require("discord.js");
const fs = require('fs');
require('dotenv').config({});
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { MongoClient } = require("mongodb");
const mongo = new MongoClient(process.env.MONGO, { useUnifiedTopology: true });
const db = mongo.db("constable");


if (!process.env.TOKEN) {
    console.log("Please provide a bot token!")
    process.exit(1)
}

if (!process.env.MONGO) {
    console.log("Please provide a MongoDB connection string!")
    process.exit(1)
}

if (!process.env.OWNER) {
    console.log("Please provide a bot owner ID!")
    process.exit(1)
}

const intents = new Intents();
intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
);

const client = new Client({
    intents: intents, partials: ["MESSAGE", "REACTION", "CHANNEL"]
});

client.commands = new Collection()
client.slashcommands = new Collection()
client.prefix = "!"
client.db = db

client.on("ready", async () => {
    console.log(`Ready! ${new Date(Date.now())}`)

    const rest = await new REST({
        version: '9'
    }).setToken(client.token);
    await rest.put(
        Routes.applicationCommands(client.user.id), {
            body: client.slashcommands.map(cmd => cmd.data.toJSON())
        },
    )
    console.log("Loaded slash commands!")

    await mongo.connect();
    console.log("Connected to MongoDB!")
});

console.log("LOADING COMMANDS...")
console.log(`Loaded:`)
for (file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.name, cmd)
    console.log(`${client.prefix}${cmd.name}`)
}

console.log("\n\nLOADING SLASH COMMANDS...")
console.log(`Loaded:`)
for (file of fs.readdirSync("./slashcommands").filter(f => f.endsWith(".js"))) {
    const command = require(`./slashcommands/${file}`)
    client.slashcommands.set(command.data.name, command)
    console.log(`/${command.data.name}`)
}

console.log("\n\nLOADING EVENTS...")
console.log(`Loaded:`)
for (file of fs.readdirSync("./events").filter(f => f.endsWith(".js"))) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(client, ...args))
    console.log(`${event.name}`)
}

process.on('unhandledRejection', async error => {
    console.log(error);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    if (!message.content.startsWith("<@" + client.user.id + ">") && !message.content.startsWith("<@!" + client.user.id + ">") && !message.content.startsWith(client.prefix)) return
    let split = message.content.split(" ");
    let search = split[1]
    if (message.content.startsWith(client.prefix)) search = split[0].slice(client.prefix.length)
    let command = client.commands.get(search) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(search));
    if (!command) return
    let i = 1;
    if (message.content.startsWith(client.prefix)) i++;
    while (i <= 2) {
        i++;
        split.shift();
    };
    
    await command.execute(client, message, split.filter(e => String(e).trim()) || []).catch(() => {})
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const slashcommand = client.slashcommands.get(interaction.commandName);
    if (!slashcommand) return;
    if (slashcommand?.perms) {
        if (!interaction.member.permissions.has(slashcommand.perms)) {
            if (interaction.user.id !== process.env.OWNER) {
                let embed = new MessageEmbed()
                    .setDescription(`You must have \`${slashcommand.perms}\` permission to use this command!`)
                    .setColor("RED")
                return interaction.reply({embeds: [embed]})
            }
        }
    }

    try {
        await slashcommand.execute(client, interaction);
    } catch (error) {
        console.error(error);
        try {
            await interaction.reply({ content: '⚠️ There was an error while executing this command!', ephemeral: true });
        } catch (error) {
            await interaction.editReply({ content: '⚠️ There was an error while executing this command!', ephemeral: true });
        }
    }
})

client.login(process.env.TOKEN);