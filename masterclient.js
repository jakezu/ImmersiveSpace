engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;

var MasterClient = Class.extend
({
    init: function()
    {

        this.data = {};

        Log("**** Creating master client objects");

        // Create MasterClient-entity which gives placeable data for the clients
        this.createMasterClientEntity();
        
        // Remove FreeLookCamera from the scene
        this.removeFreeLookCamera();
    },
	
	createMasterClientEntity: function()
	{
		mastercliententity = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		mastercliententity.SetName("MasterClient");
		mastercliententity.SetTemporary(true);
		mastercliententity.camera.SetActive();
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},
	
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		
		if (freelookcamera)
		{
			freelookcameraID = freelookcamera.Id();
			scene.RemoveEntity(freelookcameraID,'');
			Log("**** FreeLookCamera entity removed");
		}
	}
});

// Startup
_p = new MasterClient();