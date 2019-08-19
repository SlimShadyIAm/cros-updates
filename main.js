var Watcher = require('feed-watcher'),
    feedUrl = "http://googlechromereleases.blogspot.com/atom.xml",
    interval = 360; // interval to poll the feed in seconds
var request = require('request');
var he = require("he")
var stripTags = require("striptags")
var webhookUrl = process.env.webhookUrl; // stores the URL the response needs to be sent to - secret!

const rolesToPing = {
    "Stable updates": "550382017213104147",
    "Beta updates": "550401535578996754",
    "Dev updates": "550401653732540417",
}

console.log("Starting watcher service...")

var watcher = new Watcher(feedUrl, interval);

watcher.on('new entries', function(entries) { // watch for new entries to the RSS feed
    entries.forEach(function(entry) {
        if (entry.categories.includes("Chrome OS")) { // filter out non-Chrome OS related posts
            console.log(`Attempting to send new post with title '${entry.title}`)
            var discordObj = { // build the response to send to Discord's webhook - base layout
                "username": "Chrome Releases Blog", 
                "avatar_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1",
                "content": determineCategory(entry.categories),
                "embeds": [{
                    "description": sanitizeDescription(entry.description),
                    "color": 3172587,
                    "timestamp": entry.pubDate,
                    "author": {
                        "name": entry.title,
                        "url": entry.link,
                    },
                    "icon_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1",
                    "footer": {
                        "icon_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1",
                        "text": entry.author
                    }
                }]
            }

            // send the object via POST to Discord's webhook URL
            sendEmbed(discordObj);
        } else {
            console.log("Post filtered out, not ChromeOS related.");
        }
    })
})

function sanitizeArticle(description) {
    if (description.length > 150) { // truncate the description if more than 150 characters
        description = description.substring(0, 150).concat("...");
    }
    description = stripTags(description); // strip any HTML tags from text
    description = he.decode(description);
    return description;
}

function determineCategory(categories) {
    var summary = "";

    rolesToPing.map(role => {
        if (categories.includes(role)) {
            var updateType = role.substring(0, role.length-1);
            summary = `<@&${rolesToPing[role]}> Information regarding a new ${updateType} has been posted!`
        }
    })
    if (summary === "") {
        summary = "A new update blog post has been posted!";
    }
    return summary;
}

function sendEmbed(discordObj) {
    request({ 
        url: webhookUrl, 
        method: "POST",
        json: true,
        body: discordObj,
        headers: {
            "content-type": "application/json",
        }
    }, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    })
}

watcher
    .start()
    .catch(function(error) {
      console.error(error)
    })

watcher.stop();
