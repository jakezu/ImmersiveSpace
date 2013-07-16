engine.IncludeFile("local://class.js"); // from jsmodules/lib

// var voidentity = scene.GetEntityByName("Void");

// if (voidentity == null) {
	// voidentity = scene.CreateEntity(scene.NextFreeId(), /* NextFreeId() for replicated */
					// ["EC_Placeable"],					/* Components */
					// '',									/* AttributeChange enum, 2 for LocalOnly, 3 for replicated. */
					// replicated=true, 					/* Replicate entity to server and other clients */
					// componentsReplicated=true);			/* Replicate components to server and other clients */
	
	// voidentity.SetName("Void");
	// voidentity.SetTemporary(true);
	// console.LogInfo("Replicated server entity has been created with placeable component");
// }


var _p = null;
var _applicationName = "ServerApplication";

var Server = Class.extend
({
    init: function()
    {
      if (me.name != _applicationName)
          me.name = _applicationName;

      this.data = {};

      Log("**** Creating server objects");
 
		this.createVoidEntity();
		this.removeFreeLookCamera();
    },
	
	createVoidEntity: function()
	{
		voidentity = scene.CreateEntity(scene.NextFreeId(), /* NextFreeId() for replicated */
						["EC_Placeable", "EC_Camera"],		          /* Components */
						'',									                        /* AttributeChange enum, 2 for LocalOnly, 3 for replicated. */
						replicated=true, 					                  /* Replicate entity to server and other clients */
						componentsReplicated=true);			            /* Replicate components to server and other clients */

		voidentity.SetName("Void");
		voidentity.SetTemporary(true);
		voidentity.camera.SetActive();
		Log("**** Replicated server entity has been created with placeable component");
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
_p = new Server();