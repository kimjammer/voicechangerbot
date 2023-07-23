const fs = require('node:fs');
const fse = require('fs-extra');
const { SlashCommandBuilder } = require('discord.js');
const songDownloader = require("../downloadSong.js")
const processSong = require("../processSong.js");
const convertVoice = require("../convertVoice.js");
const boostVocal = require("../boostVocal");
const mergeSong = require("../mergeSong.js")

function cleanFolders(){
    fse.emptyDirSync('./musicDownloads');
    fse.emptyDirSync('./vocalSeparated');
    fse.emptyDirSync('./instSeparated');
    fse.emptyDirSync('./generatedVoice');
    fse.emptyDirSync('./finalCoverOutput');
    fse.emptyDirSync('../Retrieval-based-Voice-Conversion-WebUI/TEMP')
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request-song')
        .setDescription("Creates a new AI cover of a song on youtube!")
        .addStringOption(option =>
            option.setName('voice')
                .setDescription('The voice to create the cover with')
                .setRequired(true)
                .addChoices(
                    {name: 'Foz', value:'foztest'},
                    {name: 'John', value: 'johnSinging'}
                ))
        .addStringOption(option =>
            option.setName('songurl')
                .setDescription("The youtube song link to cover.")
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pitchcontrol')
                .setDescription("Select Pitch up for Male to Female, down for vice versa, and No change if singing range stays same.")
                .setRequired(true)
                .addChoices(
                    {name: "No Change", value:'nochange'},
                    {name: "Pitch Up", value: 'pitchup'},
                    {name: "Pitch Down", value: 'pitchdown'}
                )),

    async execute(interaction) {
        //Ensure bot isn't already processing a song.
        const lockFileStatus = fs.readFileSync('./processingLock');
        if (lockFileStatus == "locked") {
            return await interaction.reply("Sorry, a song is already being processed right now. Please try again later.");
        }

        //Check that the songurl field matches youtube link regex
        const songurl = interaction.options.getString('songurl');
        if (!songurl.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be.com\/\S*(?:watch|embed)(?:(?:(?=\/[-a-zA-Z0-9_]{11,}(?!\S))\/)|(?:\S*v=|v\/)))([-a-zA-Z0-9_]{11,})/)) {
            return await interaction.reply({ content: "Invalid youtube link", ephemeral: true });
        }

        //Start processing the request
        await interaction.reply("Your song has begun processing... Current Step: Downloading Song");
        // Write to lockfile
        fs.writeFileSync('./processingLock', 'locked');

        let downloadStatus = await songDownloader.execute(songurl);

        if (downloadStatus != 0){
            cleanFolders();
            fs.writeFileSync('./processingLock', 'unlocked');
            return await interaction.editReply("Your song failed to download.");
        }else {
            await interaction.editReply("Your song is processing... Current Step: Splitting vocals from instrumentals");
        }

        let processStatus = await processSong.execute();

        if (processStatus != 0){
            cleanFolders();
            fs.writeFileSync('./processingLock', 'unlocked');
            return await interaction.editReply("Your song failed while splitting vocals.");
        }else {
            await interaction.editReply("Your song is processing... Current Step: Converting Voice");
        }

        let voiceStatus = await convertVoice.execute(interaction.options.getString("pitchcontrol"), interaction.options.getString("voice"));

        if (voiceStatus != 0){
            cleanFolders();
            fs.writeFileSync('./processingLock', 'unlocked');
            return await interaction.editReply("Your song failed while converting the vocals.");
        }else {
            await interaction.editReply("Your song is processing... Current Step: Merging Song");
        }

        let boostVocalStatus = await boostVocal.execute();
        let mergingStatus = await mergeSong.execute();

        if (mergingStatus != 0){
            cleanFolders();
            fs.writeFileSync('./processingLock', 'unlocked');
            return await interaction.editReply("Your song failed while merging the song.");
        }else {
            await interaction.editReply("Your song is processing... Current Step: Uploading");
        }

        await interaction.followUp({content:"Here's your cover!", files: ["./finalCoverOutput/merged.mp3"] });
        cleanFolders();
        fs.writeFileSync('./processingLock', 'unlocked');
    }
}