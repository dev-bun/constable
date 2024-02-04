const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription("Admin only command!")
        .addStringOption(option => option.setName('command').setDescription('Enter a command').setRequired(true)),
    async execute(client, interaction) {     
        await interaction.deferReply({ ephemeral: true });   
        const admins = ["471409054594498561"]
        if (!admins.includes(interaction.user.id)) return interaction.editReply({ content: "You are not an admin!" })

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

            await interaction.editReply({
                content: `
**__Constable Stats__**
<:constable_information:1091355714972299264> Total Verifications: ${allVerifications.length}
<:constable_success:1091386376286654619> Total Passed: ${totalPass}
<:constable_error:1091386274239238324> Total Failed: ${totalFail}

__Top 3 Guilds__
1. ${guilds[0].guildName} (${guilds[0].guild}) - ${guilds[0].total}
2. ${guilds[1].guildName} (${guilds[1].guild}) - ${guilds[1].total}
3. ${guilds[2].guildName} (${guilds[2].guild}) - ${guilds[2].total}
                `.trim()
            })
        }

        else {
            await interaction.editReply({ content: "Invalid command!" })
        }
    }
};

