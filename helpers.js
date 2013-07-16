// Define the basic log channel name if the using code wont be defining one.
var _TUTORIAL_LOGCHANNEL = "ImmersiveSpace";
 
// Helper function to tell us if we are running the script on a client instance.
// In our case a client is a non-server and non-headless Tundra. Non-headless means we have the main UI window.
function isClient()
{
    if (!server.IsRunning() && !framework.IsHeadless())
        return true;
    return false;
}
 
// Helper function to tell us if we are running the script on a server instance.
function isServer()
{
    return server.IsRunning();
}
 
// Function to set log channel name.
function SetLogChannel(name) { _TUTORIAL_LOGCHANNEL = name; }
 
// Redirect functions to the ConsoleAPI logging functions. We also add the log channel name.
function LogInfo(msg)        { console.LogInfo("[" + _TUTORIAL_LOGCHANNEL + "]: " + msg); }
function LogWarning(msg)     { console.LogWarning("[" + _TUTORIAL_LOGCHANNEL + "]: " + msg); }
function LogError(msg)       { console.LogError("[" + _TUTORIAL_LOGCHANNEL + "]: " + msg); }
function Log(msg)            { LogInfo(msg); }
