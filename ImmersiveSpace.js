/* ImmersiveSpace.js */

/* Reference files
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

var _loaderInstance = null;
var masterClientName = "client1";

/**
 * Includes another javascript files.
 * @method engine.IncludeFile
 * @param file {String} File name
 */

engine.IncludeFile("helpers.js");
engine.IncludeFile("assets/class.js");

/**
 * The loader class.
 * @class LoaderClass
 * @extension Class
 * @constructor
 */

var LoaderClass = Class.extend
({
	/**
	 * Main class initialisation.
	 * @method init
	 * @static
	 */
	
	init: function()
	{
	
		/**
		 * File which we want to include.
		 * @property file
		 * @type String
		 */
		
		/** 
		 * Checks if this instance is running as a server.
		 * @method isServer
		 */
		
		if (isServer())
			file = "server.js";
		
		/**
		 * Checks if this instance is running as a client.
		 * @method isClient
		 */
		else if (isClient())
		{
			/**
			 * Regular expression pattern for matching slaveclient name
			 * @property regexp
			 * @type regular expression string
			 * @static
			 * @final
			 */
			var regexp = /client[2-6]/;
			
			/**
			 * Returns username from login properties
			 * @method client.LoginProperty
			 * @param "username" {String}
			 * @return {String} Username
			*/
			var username = client.LoginProperty("username");
			
			// match for the masterclient
			if (username == masterClientName) 
				file = "masterclient.js";
			
			/**
			 * Use regular expression to match for the slaveclients name.
			 * @method username.match
			 * @param regexp {Regular expression string} Returns true if match
			 * @return {Boolean} Boolean value
			 */
			else if (username.match(regexp))
				file = "slaveclients.js";

			else
			{
				/**
				 * Outputs log error message.
				 * @method LogError
				 * @param string {String} Text to output
				 */
				LogError("Client's username '" + username + "' invalid!");
				return;
			}
			
			/**
			 * Imports Qt extensions.
			 * @method engine.ImportExtension
			 * @param file {String} Qt extension file name
			 */			
			engine.ImportExtension("qt.core");
			engine.ImportExtension("qt.gui");
			engine.ImportExtension("qt.webkit");			
		}

		/**
		 * Outputs log message.
		 * @method Log
		 * @param string {String} Text to output
		 */
		Log(file + " has been included");

		engine.IncludeFile(file);
	}
});

// Startup
_loaderInstance = new LoaderClass();
