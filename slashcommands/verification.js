const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { ChannelType } = require("discord-api-types/v9")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Set up verification for your server!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable/disable verification for your server!')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the role to be given to verified users!')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to be given to verified users!')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Set the channel to send verification logs to!')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send verification logs to!')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Send the verification message to a channel!')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the verification message to!')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        ),

    perms: "MANAGE_GUILD",
    
    async execute(client, interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'toggle') {
            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, verification: { enabled: true } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "verification.enabled": !config.verification.enabled } });
            }
            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification has been ${config.verification.enabled ? "disabled" : "enabled"}!` });
        }

        else if (subcommand === 'role') {
            const role = interaction.options.getRole('role');
            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, verification: { role: role.id } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "verification.role": role.id } });
            }
            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification role has been set to <@&${role.id}>!`, allowedMentions: { parse: [] } });
        }

        else if (subcommand === 'logs') {
            const channel = interaction.options.getChannel('channel');
            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, verification: { logs: channel.id } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "verification.logs": channel.id } });
            }
            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification logs have been set to <#${channel.id}>!`, allowedMentions: { parse: [] } });
        }

        else if (subcommand === 'message') {
            const channel = interaction.options.getChannel('channel');

            const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });
            if (!config) {
                await client.db.collection("config").insertOne({ guild: interaction.guild.id, verification: { message: channel.id } });
            }
            else {
                await client.db.collection("config").updateOne({ guild: interaction.guild.id }, { $set: { "verification.message": channel.id } });
            }

            const embed = new MessageEmbed()
                .setTitle("Verification")
                .setDescription(`**${interaction.guild.name}** uses **${client.user.username}** to manually verify users and prevent raids.\n\n<:constable_information:1091355714972299264> Please click the button below to verify yourself.`)
                .setColor("ORANGE")
                .setImage(`https://cdn.blacklister.xyz/guild_verify.png`)

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('verification-start')
                        .setLabel('Verify')
                        .setStyle('SECONDARY')
                );

            let failed;
            await channel.send({ embeds: [embed], components: [row] }).catch(() => failed = true);

            if (failed) {
                const embed = new MessageEmbed()
                    .setDescription("<:constable_error:1091386274239238324> I do not have permission to send messages in that channel!")
                    .setColor("#d73f3f")
                return interaction.editReply({ embeds: [embed] });
            }

            return interaction.editReply({ content: `<:constable_success:1091386376286654619> Verification message has been sent to <#${channel.id}>!`, allowedMentions: { parse: [] } });
        }

    }
};