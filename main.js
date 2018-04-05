var Watcher = require('feed-watcher'),
    feedUrl = "http://googlechromereleases.blogspot.com/atom.xml",
    interval = 360; // interval to poll the feed in seconds
var request = require('request');
var webhookUrl = require('./webhookUrl.json'); // stores the URL the response needs to be sent to - secret!

var watcher = new Watcher(feedUrl, interval);

watcher.on('new entries', function(entries) { // watch for new entries to the RSS feed
    entries.forEach(function(entry) {
        if (entry.categories.includes("Chrome OS")) { // filter out non-Chrome OS related posts
            var discordObj = { // build the response to send to Discord's webhook - base layout
                "username": "Chrome Releases Blog", 
                "avatar_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1",
                "content": "Error finding category type!",
                "embeds": [{
                    "description": "Error finding post description!",
                    "color": 3172587,
                    "timestamp": null,
                    "footer": {
                        "icon_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1",
                        "text": "Error finding author name!"
                    },
                    "author": {
                        "name": "Error finding post title!",
                        "url": "Error finding link!",
                    "icon_url": "https://cdn.discordapp.com/emojis/363434654000349184.png?v=1"
                    }
                }]
            }
            var description = entry.description.replace(/[\r\n]/g, '').replace(" .", '.') // we want to remove any line breaks from the blog post.
            if (description.length > 150) { // truncate the description if more than 150 characters
                description = description.substring(0, 150).concat("...");
            }
            
            if (entry.categories.includes("Stable updates")) { // category based message for brief overview of the content 
                var summary = "Information regarding a new stable update has been posted!";
                return;    
            } else if (entry.categories.includes("Beta updates")) {
                var summary = "Information regarding a new beta update has been posted!";
                return;
            } else if (entry.categories.includes("Dev updates")) {
                var summary = "Information regarding a new dev update has been posted!";
                return;
            } else {
                var summary = "A new update blog post has been posted!";
            }

            // add the information specific to the blog post to the response object
            discordObj.embeds[0].description = description;
            discordObj.embeds[0].timestamp = entry.pubDate;
            discordObj.embeds[0].footer.text = entry.author;
            discordObj.embeds[0].author.name = entry.title;
            discordObj.embeds[0].author.url = entry.link;
            discordObj.content = summary;
            
            // send the object via POST to Discord's webhook URL

            var url = webhookUrl.url;
            request({ 
                url: url, 
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
    })
})

watcher
    .start()
    .catch(function(error) {
      console.error(error)
    })

watcher.stop();