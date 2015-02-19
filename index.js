var client,
    slack = function(){

    this.name = 'slack';
    this.displayname = 'Slack Chat';
    this.description = 'Send messages to woodhouse via Slack';

    this.defaultPrefs = [{
        name: 'token',
        displayname: 'Token',
        type: 'text',
        value: ''
    }];

}

slack.prototype.init = function(){
    var self = this;
    client = require('slack-client');
    this.getPrefs().done(function(prefs){
        self.connection = new client(prefs.token, true, true);

        self.connection.login();

        self.connection.on('open', function() {
            self.userid = self.connection.self.id;
        });

        self.connection.on('message', function(message) {
            self.recieveMessage(message);
        });
    });

    this.addMessageSender(function(message, to){
        self.send(message, to);
    });
}

slack.prototype.recieveMessage = function(message) {
    var channel = this.connection.getChannelGroupOrDMByID(message.channel),
        user = this.connection.getUserByID(message.user),
        nameRegex = new RegExp('^[<]{0,1}[@]{0,1}' + this.userid + '[>]{0,1}[:]{0,1}'),
        mentionRegex = new RegExp('<@([0-9a-z]+)>', 'gi'),
        mentions,
        mentionUser;

    message.text = message.text.replace(nameRegex, this.api.name);

    while (mention = mentionRegex.exec(message.text)) {
        mentionUser = this.connection.getUserByID(mention[1]);
        message.text = message.text.replace(mention[0], mentionUser.name);
    }
    if (message.type === 'message') {
        this.messageRecieved(channel, message.text, user.name);
    }
}

slack.prototype.send = function(message, channel) {
    channel.send(message)
}

slack.prototype.exit = function(){
    if (this.connection) {
        this.connection.disconnect();
    }
}

module.exports = slack;
