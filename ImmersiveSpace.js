/* ImmersiveSpace.js */

/*
// !ref: helpers.js
// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js
// !ref: assets/class.js
// !ref: assets/compass.png
// !ref: assets/needle.png
// !ref: assets/metal1.png
// !ref: assets/Metal.material
// !ref: assets/Arrow.mesh
// !ref: assets/Arrow.mesh.xml
// !ref: assets/needle.png
*/


engine.IncludeFile("helpers.js");
engine.IncludeFile("assets/class.js"); // copied

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