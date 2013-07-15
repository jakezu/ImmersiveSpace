/* ImmersiveSpace.js */

/*
// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js
*/

engine.IncludeFile("helpers.js");

var masterclient = "client1";

// server side part
if (server.IsRunning())
{
	//console.LogInfo("server!");
	engine.IncludeFile("server.js");
}

// clients part
else
{
	//console.LogInfo("client!");
	if (client.LoginProperty("username") == masterclient) 
		engine.IncludeFile("masterclient.js");
	else
		engine.IncludeFile("slaveclients.js");
}

