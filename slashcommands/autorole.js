const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require("discord.js");
const { ChannelType } = require("discord-api-types/v9")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Set up autorole for your server!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable/disable autorole for your server!')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the role to be given to on join!')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to be given to on join!')
                        .setRequired(true)
                )
        ),

    perms: "MANAGE_GUILD",
    
    async execute(client, interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'toggle') {
            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, autorole: { enabled: true } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "autorole.enabled": !config.verification.enabled } });
            }
            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification has been ${config.verification.enabled ? "disabled" : "enabled"}!` });
        }

        else if (subcommand === 'role') {
            const role = interaction.options.getRole('role');
            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, autorole: { role: role.id } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "autorole.role": role.id } });
            }
            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification role has been set to <@&${role.id}>!`, allowedMentions: { parse: [] } });
        }

    }
};