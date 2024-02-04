const { MessageEmbed } = require("discord.js");
const axios = require("axios")

module.exports = {
    name: "guildCreate",
    async execute(client, guild) {
        const channel = client.channels.cache.get('1138074403914141727')

        if (!guild.available) {
            const embed = new MessageEmbed()
                .setTitle("Joined a server [Unavailable]")
                .setDescription(`Joined <t:${Math.round(Date.now() / 1000)}:D>`)
                .setFooter({text: `ID: ${guild.id}`})
            return channel.send({embeds: [embed]})
        }

        let embed = new MessageEmbed()
	        .addField("» Name", `${guild.name}`, false)
            .addField("» Owner", `<@${guild.ownerId}>`, false)
            .addField("» Channels",  guild.channels.cache.size.toLocaleString(), false)
            .addField("» Created at", `<t:${Math.round(guild.createdTimestamp / 1000)}:D>`, false)
            .addField("» Total Members", guild.memberCount.toString(), false)
            .addField("» Roles", guild.roles.cache.size.toLocaleString(), false)
            .setThumbnail(guild.iconURL())
            .setTitle("Joined a server")
            .setDescription(`Joined <t:${Math.round(Date.now() / 1000)}:D>`)
            .setFooter({text: `ID: ${guild.id}`})
        channel.send({embeds: [embed]})

        const blacklistCheck = await axios.get(`https://api.phish.gg/server?id=${guild.id}`)
        if (blacklistCheck.data.match) {
            await guild.leave()
        }
    }
}

