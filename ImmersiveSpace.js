/* ImmersiveSpace.js */

// !ref: server.js
// !ref: masterclient.js
// !ref: slaveclients.js

// server side part
if (server.IsRunning())
{
    engine.IncludeFile("server.js");
}