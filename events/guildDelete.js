const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "guildDelete",
    async execute(client, guild) {
        const channel = client.channels.cache.get('1138074403914141727')
        
        if (!guild.available) {
            const embed = new MessageEmbed()
                .setTitle("Left a server [Unavailable]")
                .setDescription(`Left <t:${Math.round(Date.now() / 1000)}:D>`)
                .setFooter({text: `ID: ${guild.id}`})
            return channel.send({embeds: [embed]})
        }

        let embed = new MessageEmbed()
	        .addField("» Name", `${guild.name}`, false)
            .addField("» Owner", `<@${guild.ownerId}>`, false)
            .addField("» Channels",  guild.channels.cache.size.toLocaleString(), false)
            .addField("» Created at", `<t:${Math.round(guild.createdTimestamp / 1000)}:D>`, false)
            .addField("» Members", `${guild.members.cache.filter(member => !member.user.bot).size || 0}`, false)
            .addField("» Bots", `${guild.members.cache.filter(member => member.user.bot).size || 0}`, false)
            .addField("» Total Members", `${guild.memberCount || 0}`, false)
            .addField("» Roles", `${guild.roles.cache.size || 0}`, false)
            .setThumbnail(guild?.iconURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
            .setTitle("Left a server")
            .setDescription(`Left <t:${Math.round(Date.now() / 1000)}:D>`)
            .setFooter({text: `ID: ${guild.id}`})
        
        channel.send({embeds: [embed]})
        
    }
}

