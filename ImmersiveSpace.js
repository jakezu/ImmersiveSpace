/* ImmersiveSpace.js */

// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js

var masterclient = "client1";

// server side part
if (server.IsRunning())
{
	engine.IncludeFile("server.js");
}

// clients part
else
{
	if (client.LoginProperty("username") == masterclient) 
		engine.IncludeFile("masterclient.js");
	else
		engine.IncludeFile("slaveclients.js");
}

