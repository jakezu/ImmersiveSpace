/* ImmersiveSpace.js */

/*
// !ref: helpers.js
// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js
// !ref: compass.png
// !ref: needle.png
*/


engine.IncludeFile("helpers.js");

var masterclientname = "client1";

// server side part
if (isServer())
	engine.IncludeFile("server.js");

// clients part
else if (isClient())
{
	engine.ImportExtension("qt.core");
	engine.ImportExtension("qt.gui");
	engine.ImportExtension("qt.webkit");
	
	// regular expression pattern for matching client name
	var regexp = /client[2-6]/;
	
	var username = client.LoginProperty("username");
	
	// match for the masterclient
	if (username == masterclientname) 
		engine.IncludeFile("masterclient.js");
	
	// match for the slaveclients
	else if (username.match(regexp))
		engine.IncludeFile("slaveclients.js");
	
	else
		console.LogError("Username invalid!");
}

// EOF