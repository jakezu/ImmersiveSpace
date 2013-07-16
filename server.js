console.LogInfo("server!");

var replicatedentity = scene.GetEntityByName("ReplicatedEntity");

if (voidentity == null) {
	voidentity = scene.CreateEntity(scene.NextFreeId(), 		/* NextFreeId() for replicated */
					["EC_Placeable"],				/* Components */
					'',							/* AttributeChange enum, 2 for LocalOnly, 3 for replicated. */
					replicated=true, 					/* Replicate entity to server and other clients */
					componentsReplicated=true);		/* Replicate components to server and other clients */
	
	voidentity.SetName("Void");
	voidentity.SetTemporary(true);
	console.LogInfo("Replicated server entity has been created with placeable component");
}

else
	console.LogError("Server already running!");
