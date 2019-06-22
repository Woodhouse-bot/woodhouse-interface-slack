'use strict';

const client = require('@slack/client');
const bluebird = require('bluebird');

class slack {
    constructor() {
        this.name = 'slack';
        this.displayname = 'Slack Chat';
        this.description = 'Send messages to woodhouse via Slack';

        this.defaultPrefs = {
            token: {
                displayname: 'Token',
                type: 'text',
                value: ''
            }
        };
    }

    init() {
        bluebird.all([
            this.getSystemPref('name'),
            this.getPref('token')
        ]).then(([name, token]) => {
            const connection = new client.RtmClient(token, {
                dataStore: new client.MemoryDataStore()
            });
            let botId;

            connection.start();

            connection.on(client.CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
                botId = rtmStartData.self.id;
            });

            connection.on(client.RTM_EVENTS.MESSAGE, (message) => {
                const user = connection.dataStore.getUserById(message.user);
                const nameRegex = new RegExp('^[<]{0,1}[@]{0,1}' + botId + '[>]{0,1}[:]{0,1}');
                const mentionRegex = new RegExp('<@([0-9a-z]+)>', 'gi');

                if (message.type === 'message' && message.text) {
                    message.text = message.text.replace(nameRegex, name);

                    let mention;
                    while (mention = mentionRegex.exec(message.text)) {
                        let mentionUser = connection.dataStore.getUserById(mention[1]);
                        message.text = message.text.replace(mention[0], mentionUser.name);
                    }

                    this.messageRecieved(message.channel, message.text, user.name);
                }
            });

            this.addMessageSender(function(to, message){
                connection.sendMessage(message, to);
            });
        });
    }
}

module.exports = slack;
