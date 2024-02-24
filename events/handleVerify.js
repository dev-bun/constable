const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require("discord.js");
const { createCanvas, loadImage } = require('canvas')
const fs = require("fs");

const emoji = (num) => {
    switch (num) {
        case 0:
            return "<:one_icon:1091382104996192369>";
        case 1:
            return "<:two_icon:1091382109140176996>";
        case 2:
            return "<:three_icon:1091382106573250723>";
        case 3:
            return "<:four_icon:1091382102412496928>";
        default:
            return null;
    }
}

const genCaptcha = async () => {
    try {
        const folders = fs.readdirSync(__dirname + "/../utils/captcha-images").filter((folder) => folder !== ".DS_Store");
        const randomFolders = [];
        for (let i = 0; i < 4; i++) {
            const randomFolder = folders[Math.floor(Math.random() * folders.length)];
            if (randomFolders.includes(randomFolder)) {
                i--;
                continue;
            }
            randomFolders.push(randomFolder);
        }

        const type = randomFolders[Math.floor(Math.random() * randomFolders.length)];

        const sources = [];
        for (let i = 0; i < 4; i++) {
            const folder = randomFolders[i];
            const files = fs.readdirSync(__dirname + `/../utils/captcha-images/${folder}`).filter((file) => file !== ".DS_Store");
            const randomFile = files[Math.floor(Math.random() * files.length)];
            sources.push(__dirname + `/../utils/captcha-images/${folder}/${randomFile}`);
        }

        // we want to generate a collage of the images using canvas
        const canvas = createCanvas(500, 500);
        const ctx = canvas.getContext('2d');

        const images = [];
        for (let i = 0; i < 4; i++) {
            const image = await loadImage(sources[i]);
            images.push(image);
        }

        // we want to draw the images in a 2x2 grid
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.drawImage(images[i * 2 + j], 250 * j, 250 * i, 250, 250);
            }
        }

        // now grab a single dotmap from utils/dotmaps and draw it on top, makes it harder for bots to detect
        const dotmaps = fs.readdirSync(__dirname + "/../utils/dotmaps").filter((file) => file !== ".DS_Store");
        const randomDotmap = dotmaps[Math.floor(Math.random() * dotmaps.length)];
        const dotmap = await loadImage(__dirname + `/../utils/dotmaps/${randomDotmap}`);
        ctx.drawImage(dotmap, 0, 0, 500, 500);

        const grid = await loadImage(__dirname.replace("events", "utils") + "/captcha_grid.png");
        ctx.drawImage(grid, 0, 0, 500, 500);

        const buttons = [];
        for (let i = 0; i < 4; i++) {
            buttons.push(new MessageButton()
                .setCustomId(`verification-${i}`)
                .setEmoji(emoji(i))
                .setStyle("SECONDARY")
            )
        }

        return {
            images: sources,
            collage: canvas.toBuffer(),
            correctType: type,
            correctTypeIndex: randomFolders.indexOf(type),
            otherTypes: randomFolders.filter((folder) => folder !== randomFolders[sources.indexOf(sources[0])]),
            buttons: [buttons.slice(0, 2), buttons.slice(2, 4)]
        }

    } catch (err) {
        console.log(err);
        return {
            images: [],
            collage: null,
            correctType: null,
            otherTypes: [],
            buttons: []
        }
    }
};

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {   
        if (!interaction.isButton()) return;

        if (!interaction.customId.startsWith("verification")) return;

        const config = await client.db.collection("config").findOne({ guild: interaction.guild.id });

        if (!config) {
            let embed = new MessageEmbed()
                .setDescription("<:constable_error:1091386274239238324> Verification is not set up for this server!")
                .setColor("#d73f3f")
            return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        if (config?.verification?.enabled === false) {
            let embed = new MessageEmbed()
                .setDescription(`<:constable_error:1091386274239238324> **${interaction.guild.name}** has disabled verification!`)
                .setColor("#d73f3f")
            return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        const command = interaction.customId.split("-")[1];

        if (command === "start") {
            // check if role exists
            const role = interaction.guild.roles.cache.get(config?.verification?.role);
            if (!role) {
                let embed = new MessageEmbed()
                    .setDescription(`<:constable_error:1091386274239238324>  **${interaction.guild.name}** does not have a verification role set up!`)
                    .setColor("#d73f3f")
                return interaction.reply({ embeds: [embed], ephemeral: true })
            }

            if (interaction.member.roles.cache.has(config?.verification?.role)) {
                let embed = new MessageEmbed()
                    .setDescription("<:constable_warning:1091384235518074962> You are already verified!")
                    .setColor("#e18f00")
                return interaction.reply({ embeds: [embed], ephemeral: true })
            }

            const loadingEmbed = new MessageEmbed()
                .setDescription("<a:generating_captcha:1091382516147028039> Generating your image captcha...")
                .setColor("ORANGE")
            await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });

            const captcha = await genCaptcha(client);

            const attachment = new MessageAttachment(captcha.collage, "captcha.jpg");

            const embed = new MessageEmbed()
                .setTitle("Verification")
                .setDescription(`Please select the square containing: **${captcha.correctType}**`)
                .setColor("AQUA")
                .setImage("attachment://captcha.jpg")
                
            const row = new MessageActionRow()
                .addComponents(captcha.buttons[0])

            const row2 = new MessageActionRow()
                .addComponents(captcha.buttons[1])

            const message = await interaction.editReply({ embeds: [embed], files: [attachment], components: [row, row2] });
            const filter = (i) => i.customId.startsWith("verification-") && i.user.id === interaction.user.id;

            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on("collect", async (i) => {
                if (i.customId === `verification-${captcha.correctTypeIndex}`) {
                    const tempEmbed = new MessageEmbed()
                        .setDescription("Correct! Granting role...")
                        .setColor("GREEN")
                    await i.update({ embeds: [tempEmbed], files: [], components: [] });
                    try {
                        await interaction.member.roles.add(role, "User passed verification");
                        if (config?.autorole?.removeAfterVerify) {
                            await interaction.member.roles.remove(config?.autorole?.role, "User passed verification");
                        }
                    }
                    catch (err) {
                        console.log(err);
                        const errEmbed = new MessageEmbed()
                            .setDescription("I was unable to grant you the role!\nPlease contact a server admin. If you are an admin, please check my permissions.")
                            .setColor("RED")
                        return i.update({ embeds: [errEmbed], files: [], components: [] });
                    }
                    const newEmbed = new MessageEmbed()
                        .setDescription("You have been verified!")
                        .setColor("GREEN")
                    await interaction.editReply({ embeds: [newEmbed] });

                    if (config?.verification?.logs) {
                        const logChannel = interaction.guild.channels.cache.get(config?.verification?.logs);
                        if (logChannel) {
                            const logEmbed = new MessageEmbed()
                                .setDescription(`${interaction.user} has been verified!`)
                                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                                .setColor("GREEN")
                            logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                } else {
                    console.log(`Recieved ${i.customId} but expected verification-${captcha.correctTypeIndex}`)
                    const newEmbed = new MessageEmbed()
                        .setDescription("Incorrect image selected! Please try again.")
                        .setColor("RED")
                    await i.update({ embeds: [newEmbed], files: [], components: [] });

                    if (config?.verification?.logs) {
                        const logChannel = interaction.guild.channels.cache.get(config?.verification?.logs);
                        if (logChannel) {
                            const logEmbed = new MessageEmbed()
                                .setDescription(`${interaction.user} failed to verify (Incorrect image selected)`)
                                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                                .setColor("RED")
                            logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                }
            })

            collector.on("end", async (collected, reason) => {
                if (collected.size === 0) {
                    if (interaction.member.roles.cache.has(config?.verification?.role)) return; // they already verified, no need to log timeout
                    const embed = new MessageEmbed()
                        .setDescription("You took too long to verify!")
                        .setColor("RED")
                    interaction.editReply({ embeds: [embed], components: [], files: [], content: null });

                    if (config?.verification?.logs) {
                        const logChannel = interaction.guild.channels.cache.get(config?.verification?.logs);
                        if (logChannel) {
                            const logEmbed = new MessageEmbed()
                                .setDescription(`${interaction.user} failed to verify (Took too long)`)
                                .setColor("RED")
                            logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                }
            })

        }

    }
}