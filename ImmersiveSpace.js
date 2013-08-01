/* ImmersiveSpace.js */

/*
// !ref: helpers.js
// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js
// !ref: compassd.png
// !ref: needle.png
// !ref: arrow3b.png
*/

engine.IncludeFile("helpers.js");

var masterclient = "client1";

// server side part
if (isServer())
	engine.IncludeFile("server.js");

// clients part
else if (isClient())
{
	engine.ImportExtension("qt.core");
	engine.ImportExtension("qt.gui");
	engine.ImportExtension("qt.webkit");
	
	//var resolution = new QSize(1280, 800)
	//ui.MainWindow().size = resolution;
	// regular expression pattern for matching client name
	var regexp = /client[2-6]/;
	
	var username = client.LoginProperty("username");
	
	// match for the masterclient
	if (username == masterclient) 
		engine.IncludeFile("masterclient.js");
	
	// match for the slaveclients
	else if (username.match(regexp))
		engine.IncludeFile("slaveclients.js");
	
	else
		console.LogError("Username invalid!");
}

// EOF


