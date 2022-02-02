# 🚧Rusty Helper🚧

This is a wrapper for the Rust+ API for the game Rust. It allows you to do things such as monitor current and past map events, see how long until sunrise or sunset, track players login state and more.

**THIS IS A WIP AND V BUGGY, DONT ACTUALLY TRY TO USE IT ON A WIPE.**

## Prerequisites
- node.js 16.13.2 LTS installed (https://nodejs.org/en/)
- npmjs (Should be included in the node installation

## Installation

To run this software you will need to gather various keys as well as setting up a Discord bot.

An exhaustive list of the ID's and keys you need are:
- Your Rust server IP address for what you want to monitor.
- Your Rust server query port for the server you want to monitor.
- Your Steam ID
- Your Rust+ token
	> A good guide on retrieving this can be found at https://github.com/liamcottle/rustplus.js#using-the-command-line-tool (note you will need to clone Liam's repo.
- Steam API Key (found at steamcommunity.com/dev/apikey)
- Battlemetrics server ID (the bit in bold) https://www.battlemetrics.com/servers/rust/**3344761**
- Three discord channel ID's that you have created for the bot to post in. Note that the bot will need admin privileges for all three channels.
	> Create one channel for event messages, one for player tracking and one final one for bot pinned messages.
- Discord bot key
	> You will need a Discord application with an associated bot to get this. To create a bot follow this guide up to the steps for creating an invite URL. https://www.freecodecamp.org/news/create-a-discord-bot-with-python/


After you have gathered all this information you will be able to run ```npm install``` to download all the dependancies for Rusty Helper. After they have finished installing you need to run ```npm run setup``` to run the database creator. If this was created successfully then you can start the bot using ```npm start```.

## Discord commands
- ```!rh <GroupName> add <SteamidOfTrackedPlayer> // Tracks a user in the tracker discord channel.```
- ```!rh <GroupName> remove <SteamidOfTrackedPlayer> // Removes a user from the tracker```
- ```!rh <GroupName> remove all // Removes all users from a particular group```
## In game commands
These commands need to be run in team chat, even you are solo you still need to be in a team.
- ```!patrol 	// Shows last seen time for the patrol heli```
- ```!cargo 		// Shows last seen time for cargo```
- ```!bradley	// Shows last seen time for bradley crates```
- ```!large 		// Shows last seen time for large oil crates```
- ```!small 		// Shows last seen time for small oil crates```
- ```!day 		// Shows time until day```
- ```!night 		// Shows time until night```
