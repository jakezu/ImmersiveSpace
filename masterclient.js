engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;

var MasterClient = Class.extend
({
    init: function()
    {

        this.data = {};
		
        Log("**** Creating master client objects");

        this.createMasterClient();
		this.setMasterCamera();
        
        this.removeFreeLookCamera();
    },

	// Create MasterClient-entity which gives placeable data for the clients
	createMasterClient: function()
	{
		masterclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		masterclient.SetName("MasterClient");
		masterclient.SetTemporary(true);
		var placeable = masterclient.placeable;
		var voidentity = scene.GetEntityByName("Void");
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},

	// Set MasterCamera parameters
	setMasterCamera: function()
	{
		var mastercamera = masterclient.camera;
		
		// Field of vision (45 = default, 38.5 is good in one particular setup)
		mastercamera.verticalFov = 38.5;
		
		mastercamera.SetActive();

	},
	
	// Remove FreeLookCamera from the scene
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freelookcamera)
		{
			scene.RemoveEntity(freelookcamera.id,'');
			Log("**** FreeLookCamera entity removed");
		}
	}
});

// Startup
_p = new MasterClient();