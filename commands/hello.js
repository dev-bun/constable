
module.exports = {
    name: "hello", // this is the name of the command, it will be used to call the command
    aliases:["hi", "yo", "hey"], // this is optional, they are just other ways to call the command. command will still work even if you don't have aliases
    async execute(client, message, args) { // this is the function that will be called when the command is called

        await message.channel.send("HELLO!!!!") // this will send a message to the channel the command was called in
        
    }
}


