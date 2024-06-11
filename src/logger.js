const log4js = require("log4js");
const jsonLayout = require("log4js-json-layout");

const timeStamp = new Date(Date.now());
const day = timeStamp.getDate();
const month = timeStamp.getMonth() + 1;
const year = timeStamp.getFullYear();
const date = `${day}-${month}-${year}`;

log4js.addLayout("json", jsonLayout);
log4js.configure({
  appenders: {
    out: { type: "stdout" },
    application: {
      type: "file",
      filename: `log/application_${date}.log`,
      layout: { type: "json" },
    },
    channels: {
      type: "file",
      filename: `log/channel_${date}.log`,
      layout: { type: "json" },
    },
    client: {
      type: "file",
      filename: `log/client_${date}.log`,
      layout: { type: "json" },
    },
  },
  categories: {
    default: { appenders: ["out"], level: "info" },
    app: { appenders: ["application"], level: "info" },
    channel: { appenders: ["channels"], level: "info" },
    client: { appenders: ["client"], level: "info" },
  },
});
