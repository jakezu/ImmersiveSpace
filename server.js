/* server.js */

var _serverInstance = null;
var _applicationName = "ImmersiveSpaceApplication";

var voidEntity = null; //added 13.5, can delete after mittaukset

/**
 * The ServerClass class.
 * @class ServerClass
 * @extension LoaderClass
 * @constructor
*/
var ServerClass = Class.extend
({

  /**
   * Server class initialisation.
   * @method init
   * @static
  */
  init: function()
  {
      if (me.name != _applicationName)
          me.name = _applicationName;
      Log("**** Creating server objects");
      this.createVoidEntity();
      this.removeFreeLookCamera();
  },

	/**
	 * Create Void-entity with Placeable and Camera components.
	 * @method createVoidEntity
	 * @static
	*/
	createVoidEntity: function()
	{

		/**
		 * Creates new entity that contains the specified components.
		 * @method scene.CreateEntity
		 * @param id {Number} Next free ID number
		 * @param [components={}] {Object} Creates entity with listed components
		 * @param AttributeChange=Default {Enum} Enumeration of attribute/component change types for replication. (2=LocalOnly, 3=Replicate)
		 * @param replicated=true {Boolean} Whether entity is replicated to server and other clients
		 * @param componentsReplicated=true {Boolean} Whether components will be replicated to server and other clients
		 * @return {Object} Void-entity.
		*/
		var id = scene.NextFreeId();
		var components = ["EC_Placeable", "EC_Camera"];
		var attributechange = '';
		var replicated = true;
		var componentsReplicated = true;
		voidEntity = scene.CreateEntity(id, components, attributechange, replicated, components);

		/**
		 * Set Void-entity's name.
		 * @method voidEntity.SetName
		 * @param param {String}
		*/
		voidEntity.SetName("Void");

		/**
		 * Sets Void-entity's temporary value to true
		 * @method voidEntity.SetTemporary
		 * @param param {Boolean}
		*/
		voidEntity.SetTemporary(true);

		/**
		 * Sets Void-entity's camera component active
		 * @method voidEntity.camera.SetActive
		*/
		voidEntity.camera.SetActive();

		Log("**** Replicated server entity has been created with placeable component");
	},

	/**
	 * Remove FreeLookCamera from the scene.
	 * @method removeFreeLookCamera
	*/
	removeFreeLookCamera: function()
	{
		/**
		 * Get entity by name.
		 * @method scene.GetEntityByName
		 * @param name {String} Entity name to get
		 * @return {Object} FreeLookCamera.
		*/
		var freeLookCamera = scene.GetEntityByName("FreeLookCamera");

		/**
		 * Remove FreeLookCamera entity if found
		 * @method scene.RemoveEntity
		 * @param freeLookCamera.Id {Number} FreeLookCamera's id number
		 * @param AttributeChange=Default {Enum} Enumeration of attribute/component change types for replication. (2=LocalOnly, 3=Replicate)
		 * @return {Boolean} Return true if entity has been found and removed.
		*/
		if (freeLookCamera)
		{
			if(scene.RemoveEntity(freeLookCamera.Id(),''))
				Log("**** FreeLookCamera entity removed");
		}
	}
});

// Startup
_serverInstance = new ServerClass();

// EOF
