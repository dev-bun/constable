const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription("Admin only command!")
        .addStringOption(option => option.setName('command').setDescription('Enter a command').setRequired(true)),
    async execute(client, interaction) {     
        await interaction.deferReply({ ephemeral: true });   
        if (interaction.user.id !== process.env.OWNER) return interaction.editReply({ content: "No." })

        const command = interaction.options.getString('command')

        if (command === "stats") {
            const allVerifications = await client.db.collection("verification").find({}).toArray()

            const totalPass = allVerifications.filter(v => v.type === "pass").length
            const totalFail = allVerifications.filter(v => v.type === "fail").length

            const guilds = []

            for (const v of allVerifications) {
                if (!guilds.find(g => g.guild === v.guild)) {
                    const guild = client.guilds.cache.get(v.guild) || await client.guilds.fetch(v.guild).catch(() => {})
                    guilds.push({
                        guild: v.guild, 
                        total: 1,
                        guildName: guild ? guild.name : "Unknown"
                    })
                } else {
                    const index = guilds.findIndex(g => g.guild === v.guild)
                    guilds[index].total++
                }
            }

            // sort guilds by total
            guilds.sort((a, b) => b.total - a.total)

            const top = guilds.slice(0, guilds.length > 3 ? 3 : guilds.length)
            await interaction.editReply({
                content: `
**__Constable Stats__**
<:constable_information:1091355714972299264> Total Verifications: ${allVerifications.length}
<:constable_success:1091386376286654619> Total Passed: ${totalPass}
<:constable_error:1091386274239238324> Total Failed: ${totalFail}

__Top 3 Guilds__
${top.map((g, i) => `${i + 1}. ${g.guildName} (${g.guild}) - ${g.total}`).join("\n")}
${guilds.length > 3 ? `... and ${guilds.length - 3} more` : ""}
                `.trim()
            })
        }

        else {
            await interaction.editReply({ content: "Invalid command!" })
        }
    }
};