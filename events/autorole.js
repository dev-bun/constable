const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require("discord.js");
const { createCanvas, loadImage } = require('canvas')
const fs = require("fs");

module.exports = {
    name: "guildMemberAdd",
    async execute(client, member) {
        const config = await client.db.collection("config").findOne({ guild: member.guild.id });

        if (config && config?.verification && config?.verification?.enabled && config?.verification?.role) {
            const role = member.guild.roles.cache.get(config.verification.role);
            if (role) {
                await member.roles.add(role, "Autorole");
            }
        }

    }
}