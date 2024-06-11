const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

const { getGuildData } = require("../events/activityUtils");

async function getOwner(data, channel) {
  let index = data.aActiveChannels.findIndex((data) => data.id === channel.id);
  return data.aActiveChannels[index]["master"];
}

async function sendButtons(channel) {
  const firstButton = new ButtonBuilder()
    .setLabel("Edit Name")
    .setStyle(ButtonStyle.Primary)
    .setCustomId("edit-name");

  const secondButton = new ButtonBuilder()
    .setLabel("second button")
    .setStyle(ButtonStyle.Primary)
    .setCustomId("second-button");

  const buttonRow = new ActionRowBuilder().addComponents(firstButton);

  const reply = await channel.send({
    components: [buttonRow],
  });

  // Get the Channel Owner
  var guildData = await getGuildData(channel.guildId);
  var ownedBy = getOwner(guildData, channel);
  const filter = (i) => i.user.id === ownedBy;

  const collector = reply.createMessageComponentCollector({
    ComponentType: ComponentType.Button,
    filter, // filter this collector to be accessible by the channel owner only
    time: 10 * 1000, // sets a time limit to the interaction 10ms * 1000 = 10seconds
  });

  // Collector time edit the reply and disables these buttons
  collector.on("end", () => {
    firstButton.setDisabled(true);
    secondButton.setDisabled(true);
    reply.edit({
      components: [buttonRow],
    });
  });
}

module.exports = { sendButtons };
