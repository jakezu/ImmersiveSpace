/* masterclient.js /*

/* Globals and their initial values */
var _masterClientInstance = null;
var masterClient; // MasterClient entity
var masterCamera; // Camera component of MasterClient entity
var masterTransform; // Variable for transform function of Master Client's placeable component
var DEFAULT_SECT = 1; // Global value for sector of direction of travel
var DEFAULT_FOV = 38.5; // Global value for Field of vision (45 = default, 38.5 is good in one particular setup)
var DEFAULT_DIR = 0; // Global value for direction of travel
var DEFAULT_BEAR = 0.0; // Global value for bearing
var DEFAULT_AZM = 0.0; // Global value for azimuth
var DEFAULT_ALT = 20; // Global value for altitude
var DEFAULT_POS = new float3(0, DEFAULT_ALT, 0); //Global value for spawn point position of Void-entity
var DEFAULT_ROT = new float3(0, DEFAULT_AZM, 0); //Global value for spawn point rotation of Void-entity
var sector = DEFAULT_SECT; // Set initial value for sector of direction of travel
var fov = DEFAULT_FOV; // Set initial value of fov
var direction = DEFAULT_DIR; // Set initial value of direction of travel
var bearing = DEFAULT_BEAR; // Set initial value of bearing
var azimuth = DEFAULT_AZM; // Set initial value of azimuth
var altitude = DEFAULT_ALT; // Set initial value of altitude
var voidEntity = scene.GetEntityByName("Void"); // Gets 'Void' entity
var voidTransform; // Variable for transform function of Void's placeable component
var compass = new QPixmap(); // Qt Compass object
var needle = new QPixmap(); // Qt Needle object of Compass
var mainWidget = new QWidget(); // Info layout widget for showing additional information
var widget1 = new QLabel(); // Info widget #1
var widget2 = new QLabel(); // Info widget #2
var widget3 = new QLabel(); // Info widget #3
var widget4 = new QLabel(); // Info widget #4
var widget5 = new QLabel(); // Info widget #5
var infoWidgetProxy; // Info widget proxy layer
var helperWidgetProxy; // Helper widget proxy layer
var block_size = 0; // Letter box initial size
var block_left = new QGraphicsPolygonItem(); // Left letter box
var block_right = new QGraphicsPolygonItem(); // Right letter box
var mouselook = false; // Mouse look default boolean value
var arrow3D; // 3D arrow entity
var arrow3DTransform; // Variable for transform function of 3D Arrow's placeable component
var DEFAULT_A3D_POS = new float3(0,-0.9,-3); // Initial value of 3D Arrow's position
var DEFAULT_A3D_ROT = new float3(0,-90,0); // Initial value of 3D Arrow's rotation
var DEFAULT_A3D_SA = new float3(0.1,0.01,0.1); // Initial value of 3D Arrow's scale
var radians; // Variable for trigonometric calculations

/**
 * Movement modifier.
 * @class MovementModifier
 * @static
 */
//var _g =
var MovementModifier =
{
	rotate :
	{
		/**
		 * Set rotating sensitivity.
		 * @property MovementModifier.rotate.sensitivity
		 * @type Number
		 */
		sensitivity : 0.3
	},

	move :
	{
		/**
		 * Set moving sensitivity.
		 * @property MovementModifier.moving.sensitivity
		 * @type Number
		 */
		sensitivity : 10.0,

		/**
		 * Set moving amount vector.
		 * @property MovementModifier.moving.amount
		 * @type Number
		 */
		amount : new float3(0,0,0)
	},

	/**
	 * Set motion vector.
	 * @property MovementModifier.motion
	 * @type Number
	 */
	motion : new float3(0,0,0),
};

/**
The MasterClass class.
@class MasterClass
@extension LoaderClass
@constructor
*/
var MasterClass = Class.extend
({
	/**
	 * Master class initialisation.
	 * @method init
	 * @static
	 */

	init: function()
	{

		/**
		 * Connect frame updates.
		 * @event frame.Updated.connect
		 * @param Update {Object} Function to invoke
		 */
		frame.Updated.connect(this.Update);

		Log("**** Creating master client objects");

		this.clearScene();
		this.setInfoWidgetLayout();
		this.removeFreeLookCamera();
		this.createMasterClient();
		this.create3DArrow();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		this.drawCompass();
		this.showInfoWidgetDefaultValues();
		this.helpWidget();

		/**
		 * Connect camera movement handler.
		 * @event entity.Action("MSG_MOVE_CAM").Triggered.connect
		 * @param MoveCameras {Object} Function to invoke
		 */
		voidEntity.Action("MSG_MOVE_CAM").Triggered.connect(this.MoveCameras);

		/**
		 * Connect screen letterbox size handler.
		 * @event entity.Action("MSG_LETTER_BOX").Triggered.connect
		 * @param LetterBox {Object} Function to invoke
		 */
		voidEntity.Action("MSG_LETTER_BOX").Triggered.connect(this.LetterBox);

		/**
		 * Connect status message handler.
		 * @event entity.Action("MSG_STATUSMSG").Triggered.connect
		 * @param UpdateStatus {Object} Function to invoke
		 */
		voidEntity.Action("MSG_STATUSMSG").Triggered.connect(this.UpdateStatus); //

		/**
		 * Connect window resize listener.
		 * @event ui.GraphicsScene().sceneRectChanged.connect
		 * @param windowResized {Object} Function to invoke
		 */
		ui.GraphicsScene().sceneRectChanged.connect(this.windowResized);

		/**
		 * Connect attribute change listener.
		 * @event  entity.placeable.AttributeChanged.connect
		 * @param ParentEntityRefChanged {Object} Function to invoke
		 */
        masterClient.placeable.AttributeChanged.connect(this.ParentEntityRefChanged);	// If user changes parent entity reference this function is called
	},

	/**
	 * Clears duplicates from scene when Script is (re)loaded
	 * @method clearScene
	 */
	clearScene: function()
	{
		/**
		 * Get array of scene items.
		 * @method ui.GraphicsScene().items
		 * @return {Array} ui_items.
		 */

		var ui_items = ui.GraphicsScene().items();
		for (var i=0; i < ui_items.length; i++)
		{
			if (ui_items[i].type() == 5 || ui_items[i].type() == 7) // 5=letter box, 7=compass
			{
				/**
				 * Remove item.
				 * @method ui.GraphicsScene().removeItem
				 * @param param {Object} Item to remove
				 */
				ui.GraphicsScene().removeItem(ui_items[i]);

				Log("**** Removed: " +ui_items[i]);
			}
		}

		/**
		 * Get entity by name.
		 * @method scene.GetEntityByName
		 * @param name {String} Entity name to get
		 * @return {Object} Arrow.
		 */

		var oldArrow = scene.GetEntityByName("Arrow");
		if (oldArrow)
		{
			/**
			 * Remove (old) Arrow entity if found
			 * @method scene.RemoveEntity
			 * @param oldArrow.Id {Number} Arrow's id number
			 * @param AttributeChange=Default {Enum} Enumeration of attribute/component change types for replication. (2=LocalOnly, 3=Replicate)
			 * @return {Boolean} Return true if entity has been found and removed.
			*/
			scene.RemoveEntity(oldArrow.Id(),'');

			Log("**** Old Arrow entity removed");
		}
	},


	/**
	 * Sets and shows Info widget default values.
	 * @method showInfoWidgetDefaultValues
	 */
	showInfoWidgetDefaultValues: function()
	{
		widget1.text = "Client1 (MasterClient)";
		widget2.text = "Azimuth: " +azimuth.toFixed(2);
		widget3.text = "Direction of travel: " +direction;
		widget4.text = "Sector: "+sector;
		widget5.text = "Altitude: "+voidEntity.placeable.transform.pos.y;//.toFixed(2);
	},

	/**
	 * Create 3D Arrow entity.
	 * @method create3DArrow
	 */
	create3DArrow: function()
	{
		/**
		 * Create 3D Arrow local entity with Placeable, Mesh and Name components.
		 * @method scene.CreateLocalEntity
		 * @param components {Array} Creates entity with listed components
		 */
		arrow3D = scene.CreateLocalEntity(["EC_Placeable", "EC_Mesh", "EC_Name"]);

		/**
		 * Set entity's name.
		 * @method entity.SetName
		 * @param param {String}
		 */
		arrow3D.SetName("Arrow");

		/**
		 * Set mesh reference of entity.
		 * @method entity.mesh.meshRef
		 * @param param {String} Mesh file name and path
		 */
		arrow3D.mesh.meshRef = "assets/Arrow.mesh";

		/**
		 * Set mesh material of entity.
		 * @method entity.mesh.meshMaterial
		 * @param param {String} Mesh material file name and path
		 */
		var mats = arrow3D.mesh.meshMaterial;
		mats[0] = "assets/Metal.material";
		arrow3D.mesh.meshMaterial = mats;

		/**
		 * Parents this entity to another entity.
		 * @method entity.placeable.SetParent
		 * @param entity {Object} Parenting refers to this entity (Void-entity)
		 * @param preserveWorldTransform=false {Boolean} When false, the transform attribute of this placeable is treated as the new local
		 */
		arrow3D.placeable.SetParent(voidEntity, preserveWorldTransform=false);

		/**
		 * Set transformation of entity.
		 * @method entity.placeable.transform
		 */
		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.pos = DEFAULT_A3D_POS;
		arrow3DTransform.rot = DEFAULT_A3D_ROT;
		arrow3DTransform.scale = DEFAULT_A3D_SA;
		arrow3D.placeable.transform = arrow3DTransform; // sets transformation
	},


	/**
	 * Send new parent entity reference value to all slave clients if user changes that.
	 * @method ParentEntityRefChanged
	 * @param attribute {Object} Attribute of MasterClient-entity's Placeable-component
	 */
	ParentEntityRefChanged: function(attribute)
	{
		if (attribute.name === "Parent entity ref")
		{
			/**
			 * Represents an executable command on the Void-entity.
			 * @method voidEntity.Exec
			 * @param ExecType {Enum} Execution type of the action, i.e. where the actions are executed. 1=local, 2=server. 4=peers, 5=local+peers...
			 * @param p1 {Signal} 1st parameter for the action, if applicable. Emitted when the action is triggered
			 * @param p2 {Signal} 2nd parameter for the action, if applicable. Emitted when the action is triggered
			 * @param p3 {Signal} 3rd parameter for the action, if applicable. Emitted when the action is triggered
			 * @param rest {Array} 	Rest of the parameters, if applicable
			 */
			voidEntity.Exec(4, "MSG_PARENT_ENTITY_REF_CHG", attribute.value);
			voidEntity.Exec(5, "MSG_STATUSMSG", "Parent entity reference: " + (scene.GetEntityRaw(attribute.value)).name);
		}
	},

	/**
	 * Create Info widgets and layout for them
	 * @method setInfoWidgetLayout
	 */
	setInfoWidgetLayout: function()
	{
		var layout = new QVBoxLayout();

		/**
		 * Sets the layout manager for mainWidget.
		 * @method mainWidget.setLayout
		 * @param layout (QLayout)
		 */
		mainWidget.setLayout(layout);

		/**
		 * Sets both the minimum and maximum width of mainWidget.
		 * @method mainWidget.setFixedWidth
		 * @param w (Number)
		 */
		mainWidget.setFixedWidth(250);

		/**
		 * Adds the given widget to the cell grid at row, column. The top-left position is (0, 0) by default.
		 * @method layout.addWidget
		 * @param widget {QWidget}
		 * @param row {Number}
		 * @param column {Number}
		 */
		layout.addWidget(widget1, 0, 1);
		layout.addWidget(widget2, 0, 1);
		layout.addWidget(widget3, 0, 1);
		layout.addWidget(widget4, 0, 1);
		layout.addWidget(widget5, 0, 1);

		/**
		 * Sets the left, top, right, and bottom margins to use around the layout.
		 * @method layout.setContentsMargins
		 * @param left {Number}
		 * @param top {Number}
		 * @param right {Number}
		 * @param bottom {Number}
		 */
		layout.setContentsMargins(10,0,10,5);

		/**
		 * Sets spacing between widgets inside the layout.
		 * @method layout.setSpacing
		 * @param [i] {Number}
		 */
		layout.setSpacing(2);

		/**
		 * This property holds the scene rectangle; the bounding rectangle of the scene.
		 * @method ui.GraphicsScene().sceneRect
		 * @return {QRectF} Rectangle in the plane using floating point precision
		 */
		rect = ui.GraphicsScene().sceneRect;

		/**
		 * Creates a proxy widget for the widget and adds it to the main graphics scene.
		 * @method ui.AddWidgetToScene
		 * @param widget {QWidget}
		 * @return {QGraphicsProxyWidget} Proxy widget
		 */
		infoWidgetProxy = ui.AddWidgetToScene(mainWidget);

		/**
		 * @attribute infoWidgetProxy.windowFlags
		 * @type Enum 0=Widget, 1=Window, 2=Dialog, 8=Popup, 0xA=Tool, 0xC=ToolTip, 0xE=SplashScreen...
		 * @default 0
		 */
		infoWidgetProxy.windowFlags = 0;

		/**
		 * @attribute infoWidgetProxy.visible
		 * @type Boolean
		 */
		infoWidgetProxy.visible = true;

		/**
		 * @attribute infoWidgetProxy.y
		 * @type Number
		 */
		infoWidgetProxy.y = 10;

		/**
		 * @attribute infoWidgetProxy.x
		 * @type Number
		 */
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;

		/**
		 * Customize the look of widget.
		 * @method mainWidget.setStyleSheet
		 * @param widget&styleSheet {Mixed} setStyleSheet(widget {styleSheet})
		 */
		mainWidget.setStyleSheet("QLabel {color: black; font-size: 14px;}");

		/**
		 * Sets the level of opacity for the window (widget). Default 1.0
		 * @method mainWidget.setWindowOpacity
		 * @param level {qreal}
		 */
		mainWidget.setWindowOpacity(0.3);

		widget1.setStyleSheet("QLabel {color: blue; font-size: 18px; font-weight: bold;}");

	},

	/**
	 * Create Helper widget
	 * @method helpWidget
	 */
	helpWidget: function()
	{
		var helpLabel = new QLabel();

		/**
		 * Set the label's text.
		 * @attribute QLabel.text
		 * @type String
		 */
		helpLabel.text =
			"KEYBOARD COMMANDS\n\
			\nW/S/A/D		Move forward/backward/left/right\
			\nSPACE/C	Move up/down\
			\nL/K		Increase/reset black box size\
			\nNumpad +	Change direction of travel to the next sector\
			\nNumpad -	Change direction of travel to the previous sector\
			\nNumpad 8/9	Minor/Major increase vertical FOV\
			\nNumpad 5/6	Minor/Major decrease vertical FOV\
			\nNumpad 7/4	Move cameras forward/backward\
			\nR		Reset to initial state\
			\nH		Show/hide this help\
			\nQ		Show/hide all widgets\
			";
		helperWidgetProxy = new UiProxyWidget(helpLabel);
		helpLabel.setStyleSheet("QLabel {background-color: white; color: black; font-size: 16px; margin: 10px;}");
		helpLabel.setFixedWidth(500);
		helpLabel.setFixedHeight(270);
		helperWidgetProxy.windowFlags = 0;
		helperWidgetProxy.y = 50;
		helperWidgetProxy.x = 310;

		/**
		 * Adds proxy widget to the scene
		 * @method ui.AddProxyWidgetToScene
		 * @param ProxyWidget {QGraphicsProxyWidget}
		 */
		ui.AddProxyWidgetToScene(helperWidgetProxy);

		helperWidgetProxy.visible = true;
	},

	/**
	 * Resize black block sizes on screen edges
	 * @method LetterBox
	 * @param size {Number}
	 */
	LetterBox: function(size)
	{
		ui.GraphicsScene().removeItem(block_left);
		ui.GraphicsScene().removeItem(block_right);
		if (size!=0)
		{
			var color = new QColor("black");

			/**
			 * Gets main application window
			 * @method ui.MainWindow
			 * @return {Object} Main window
			 */
			var mainwin = ui.MainWindow();

			/**
			 * Get main window height
			 * @method mainwin.size.height
			 * @return {Number} height
			 */
			var height = mainwin.size.height();

			/**
			 * Get main window width
			 * @method mainwin.size.width
			 * @return {Number} width
			 */
			var width = mainwin.size.width();

			/* Creates coordinate points and polygons created from them */
			var point_left1 = new QPointF(0,0);
			var point_left2 = new QPointF(size,0);
			var point_left3 = new QPointF(size,height);
			var point_left4 = new QPointF(0,height);
			var points_left = new Array(point_left1, point_left2, point_left3, point_left4);
			var qpoly_left = new QPolygon(points_left);
			var poly_left = new QPolygonF(qpoly_left);

			var point_right1 = new QPointF(width,0);
			var point_right2 = new QPointF(width-size,0);
			var point_right3 = new QPointF(width-size,height);
			var point_right4 = new QPointF(width,height);
			var points_right = new Array(point_right1, point_right2, point_right3, point_right4);
			var qpoly_right = new QPolygon(points_right);
			var poly_right = new QPolygonF(qpoly_right);

			block_left = new QGraphicsPolygonItem(poly_left, 0, scene);
			block_right = new QGraphicsPolygonItem(poly_right, 0, scene);

			/**
			 * Used here to set the item's color.
			 * @method QGraphicsPolygonItem.setBrush
			 * @param color {QColor} Brush color
			 */
			block_left.setBrush(color);
			block_right.setBrush(color);

			/**
			 * Set item's opacity.
			 * @method QGraphicsPolygonItem.setOpacity
			 * @param level {qreal}
			 */
			block_left.setOpacity(1.0);
			block_right.setOpacity(1.0);

			/**
			 * Add item.
			 * @method ui.GraphicsScene().addItem
			 * @param param {Object} Item to add
			 */
			ui.GraphicsScene().addItem(block_left);
			ui.GraphicsScene().addItem(block_right);
		}
	},

	/**
	 * Move master camera forward or backward
	 * @method MoveCameras
	 * @param param {String} forward|backward
	 */
	MoveCameras: function(param)
	{
		masterTransform = masterClient.placeable.transform;
		radians = (sector-1)*60*Math.PI/180;

		if (param == "forward")
		{
			masterTransform.pos.z -= Math.cos(radians);
			masterTransform.pos.x += Math.sin(radians);
			masterClient.placeable.transform = masterTransform;
		}
		else if (param == "backward")
		{
			masterTransform.pos.z += Math.cos(radians);
			masterTransform.pos.x -= Math.sin(radians);
			masterClient.placeable.transform = masterTransform;
		}
		voidEntity.Exec(5, "MSG_STATUSMSG", "Camera new z position: "+(-masterTransform.pos.z));
		//masterCamera.SetActive(); //13.5
	},


	/**
	 * Set new x coordinate point of InfoWidget if window size resized.
	 * @method windowResized
	 * @param rect {QRectF}
	 */
	windowResized: function(rect)
	{
		infoWidgetProxy.x = rect.width()-mainWidget.width-10;
	},


	/**
	 * Emitted when it is time for client code to update their applications.
	 * @method Update
	 * @param frametime {float} Elapsed time in seconds since the last frame
	 */
	Update: function(frametime)
	{
		/**
		 * Begin profiling a piece of code.
		 * @method profiler.BeginBlock
		 * @param Label {String} Profiling label
		 */
		profiler.BeginBlock("VoidEntity_Update");

		if (MovementModifier.move.amount.x == 0 && MovementModifier.move.amount.y == 0 && MovementModifier.move.amount.z == 0)
		{
			profiler.EndBlock();
			return;
		}

		MovementModifier.motion.x = MovementModifier.move.amount.x * MovementModifier.move.sensitivity * frametime;
		MovementModifier.motion.y = MovementModifier.move.amount.y * MovementModifier.move.sensitivity * frametime;
		MovementModifier.motion.z = MovementModifier.move.amount.z * MovementModifier.move.sensitivity * frametime;

		/**
		 * Returns the orientation of entity's transform.
		 * @method entity.placeable.Orientation
		 * @param MovementModifier.motion {Array} MovementModifier.motion vector multiplied by quaternion of itself
		 */
		MovementModifier.motion = voidEntity.placeable.Orientation().Mul(MovementModifier.motion);

		/**
		 * Sets the position of entity's transform.
		 * @method entity.placeable.SetPosition
		 * @param MovementModifier.motion {Array} Current position added by g_motion
		 */
		voidEntity.placeable.SetPosition(voidEntity.placeable.Position().Add(MovementModifier.motion));

		profiler.EndBlock();
	},

	/**
	 * Create MasterClient-entity which handles MasterClient components
	 * @method createMasterClient
	 */
	createMasterClient: function()
	{
		masterClient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);
		masterClient.SetName("MasterCamera");

		/**
		 * Sets entity's temporary value to true
		 * @method entity.SetTemporary
		 * @param param {Boolean}
		 */
		masterClient.SetTemporary(true);

		masterClient.placeable.SetParent(voidEntity, preserveWorldTransform=false);

		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},

	/**
	 * Set MasterCamera parameters. MasterCamera is responsible for showing proper viewport of MasterClient.
	 * @method setMasterCamera
	 */
	setMasterCamera: function()
	{
		/**
		 * Gets camera component of entity.
		 * @method entity.camera
		 * @return {Object} Camera object
		 */
		masterCamera = masterClient.camera;

		/**
		 * @attribute camera.verticalFov
		 * @type Number
		 */
		masterCamera.verticalFov = DEFAULT_FOV;

		/**
		 * Activates camera component.
		 * @method camera.SetActive
		 */
		masterCamera.SetActive();
	},

	/**
	 * Set initial spawn point
	 * @method setSpawnPoint
	 */
	setSpawnPoint: function()
	{
		voidEntity.placeable.SetPosition(DEFAULT_POS);
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot = DEFAULT_ROT;
		voidEntity.placeable.transform = voidTransform;
	},

	/**
	 * Create handler for keyboard and mouse events
	 * @method createInputHandler
	 */
	createInputHandler: function()
	{
		/**
		 * Creates a new input context.
		 * @method input.RegisterInputContextRaw
		 * @param name {String} Sets the name of this InputContext
		 * @param priority {Number} InputContext priority
		 */
		var inputContext = input.RegisterInputContextRaw("MasterCamera", 101);

		/**
		 * Set to true to receive mouse input events even when the mouse cursor is over a Qt widget.
		 * @attribute inputContext.takeMouseEventsOverQt
		 * @type Boolean
		 */
		inputContext.takeMouseEventsOverQt = true;

		/**
		 * Connect key press handler.
		 * @event inputContext.KeyPressed.connect
		 * @param HandleKeyPress {Object} Function to invoke
		 */
		inputContext.KeyPressed.connect(this, this.HandleKeyPress);

		/**
		 * Connect key release handler.
		 * @event inputContext.KeyReleased.connect
		 * @param HandleKeyRelease {Object} Function to invoke
		 */
		inputContext.KeyReleased.connect(this, this.HandleKeyRelease);

		/**
		 * Connect mouse event handler.
		 * @event inputContext.MouseEventReceived.connect
		 * @param HandleMouse {Object} Function to invoke
		 */
		inputContext.MouseEventReceived.connect(this, this.HandleMouse);
		Log("**** InputHandler initialized...");
	},

	/**
	 * Handler for key press commands
	 * @method HandleKeyPress
	 * @param e {KeyEvent}
	 */
	HandleKeyPress: function(e)
	{
		// convert angle of direction to radians
		radians = (direction)*Math.PI/180;

		voidEntity.Exec(5, "MSG_STATUSMSG", "ZX-coordinates: "
			+ voidEntity.placeable.WorldPosition().z.toFixed(2)
			+ ", " +voidEntity.placeable.WorldPosition().x.toFixed(2));

		// move forward
		if (e.keyCode == Qt.Key_W)
		{
			MovementModifier.move.amount.z = -Math.cos(radians);
			MovementModifier.move.amount.x = Math.sin(radians);

		}

		// move backward
		else if (e.keyCode == Qt.Key_S)
		{
			MovementModifier.move.amount.z = Math.cos(radians);
			MovementModifier.move.amount.x = -Math.sin(radians);
		}

		// move right
		else if (e.keyCode == Qt.Key_D)
		{
			MovementModifier.move.amount.z = Math.sin(radians);
			MovementModifier.move.amount.x = Math.cos(radians);
		}

		// move left
		else if (e.keyCode == Qt.Key_A)
		{
			MovementModifier.move.amount.z = -Math.sin(radians);
			MovementModifier.move.amount.x = -Math.cos(radians);
		}

		// move up
		else if (e.keyCode == Qt.Key_Space)
		{
			MovementModifier.move.amount.y = 1;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2));
		}

		// move down
		else if (e.keyCode == Qt.Key_C)
		{
			MovementModifier.move.amount.y = -1;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Altitude: "+voidEntity.placeable.transform.pos.y.toFixed(2));
		}

		// change direction of travel to next sector (Numpad Plus)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_Plus)
		{
			/**
			 * Round a number upward to it's nearest integer.
			 * @method Math.ceil
			 * @param param {Number}
			 * @return {Number} Rounded result
			 */
			if (direction == Math.ceil(direction/60)*60)
				direction += 60;
			else
				direction = Math.ceil(direction/60)*60;
			if (direction > 300)
				direction = 0;

			arrow3DTransform.rot.y = -90-direction;
			arrow3D.placeable.transform = arrow3DTransform;
			sector = direction/60+1;
			voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
			widget3.text = "Direction of travel: " +direction;
			widget4.text = "Sector: "+sector;
		}

		// change direction of travel to previous sector (Numpad Minus)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_Minus)
		{
			/**
			 * Round a number downward  to it's nearest integer.
			 * @method Math.floor
			 * @param param {Number}
			 * @return {Number} Rounded result
			 */
			if (direction == Math.floor(direction/60)*60)
				direction -= 60;
			else
				direction = Math.floor(direction/60)*60;
			if (direction < 0)
				direction = 300;

			arrow3DTransform.rot.y = -90-direction;
			arrow3D.placeable.transform = arrow3DTransform;
			sector = direction/60+1;
			voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
			widget3.text = "Direction of travel: " +direction;
			widget4.text = "Sector: "+sector;
		}

		// major increase vertical fov (Numpad 9)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_9)
		{
			fov += 1.0;
			masterCamera.verticalFov = fov;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);	// 4=peers
		}

		// minor increase vertical fov (Numpad 8)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_8)
		{
			fov += 0.05;
			masterCamera.verticalFov = fov;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}

		// major decrease vertical fov (Numpad 6)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_6)
		{
			fov -= 1.0;
			masterCamera.verticalFov = fov;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}

		// minor decrease vertical fov (Numpad 5)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_5)
		{
			fov -= 0.05;
			masterCamera.verticalFov = fov;
			voidEntity.Exec(5, "MSG_STATUSMSG", "Field of vision: "+fov.toFixed(2));
			voidEntity.Exec(4, "MSG_FOV_CHG", fov);
		}

		// Reset initial state
		else if (e.keyCode == Qt.Key_R)
		{
			this.setSpawnPoint();
			fov = DEFAULT_FOV;
			direction = DEFAULT_DIR;
			azimuth = DEFAULT_AZM;
			sector = DEFAULT_SECT;
			masterCamera.verticalFov = DEFAULT_FOV;

			/**
			 * Rotates QPixmap object around its center.
			 * @method QPixmap.setRotation
			 * @param degrees {Number}
			 */
			//compass.setRotation((voidTransform.rot.y)%360) //del 14.5
			compass.setRotation((voidTransform.rot.y))

			arrow3DTransform = arrow3D.placeable.transform;
			arrow3DTransform.rot = DEFAULT_A3D_ROT;
			arrow3DTransform.pos = DEFAULT_A3D_POS;
			arrow3D.placeable.transform = arrow3DTransform;

			masterClient.placeable.SetPosition(new float3(0,0,0));
			this.showInfoWidgetDefaultValues();
			voidEntity.Exec(5, "MSG_STATUSMSG", "CAMERAS SET TO INITIAL STATE");
			voidEntity.Exec(4, "MSG_RESET_CAMERAS");
		}

		// Move cameras forward (Numpad 7)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_7)
			voidEntity.Exec(5, "MSG_MOVE_CAM", "forward");

		// Move cameras backward (Numpad 4)
		else if (e.modifiers & Qt.KeypadModifier && e.keyCode == Qt.Key_4)
			voidEntity.Exec(5, "MSG_MOVE_CAM", "backward");

		// Increase black block size
		else if (e.keyCode == Qt.Key_L)
		{
			block_size += 5;
			voidEntity.Exec(5, "MSG_LETTER_BOX", block_size);
		}

		// Reset black block size
		else if (e.keyCode == Qt.Key_K)
		{
			block_size = 0;
			voidEntity.Exec(5, "MSG_LETTER_BOX", block_size);
		}

		// Show/hide all widgets and extra graphics
		else if (e.keyCode == Qt.Key_Q)
		{
			if (infoWidgetProxy.visible == true)
			{
				infoWidgetProxy.visible = false;
				helperWidgetProxy.visible = false;

				/**
				 * Hide QPixmap object.
				 * @method QPixmap.hide
				 * @type QPixmap
				 */
				compass.hide();
				needle.hide();

				/**
				 * Removes mesh.
				 * @method entity.mesh.RemoveMesh
				 */
				arrow3D.mesh.RemoveMesh();
				voidEntity.Exec(4, "MSG_TOGGLE_WIDGETS", "HIDE");
			}
			else
			{
				infoWidgetProxy.visible = true;

				/**
				 * Show hidden QPixmap object.
				 * @method QPixmap.show
				 * @type QPixmap
				 */
				compass.show();
				needle.show();
				arrow3D.mesh.meshRef = "assets/Arrow.mesh";
				voidEntity.Exec(4, "MSG_TOGGLE_WIDGETS", "SHOW");
			}
		}

		// Show/hide help widget
		else if (e.keyCode == Qt.Key_H)
		{
			if (helperWidgetProxy.visible == true)
				helperWidgetProxy.visible = false;
			else
				helperWidgetProxy.visible = true;
		}
	},

	/**
	 * Handler for key release commands (stop movement)
	 * @method HandleKeyRelease
	 * @param e {KeyEvent}
	 * @return
	 */
	HandleKeyRelease: function(e)
	{
	if (e.keyCode == Qt.Key_W && MovementModifier.move.amount.z != 0 )
		MovementModifier.move.amount = new float3(0,0,0);

	else if (e.keyCode == Qt.Key_S && MovementModifier.move.amount.z != 0)
		MovementModifier.move.amount = new float3(0,0,0);

	else if (e.keyCode == Qt.Key_D && MovementModifier.move.amount.x != 0)
		MovementModifier.move.amount = new float3(0,0,0);

	else if (e.keyCode == Qt.Key_A && MovementModifier.move.amount.x != 0)
		MovementModifier.move.amount = new float3(0,0,0);

	else if (e.keyCode == Qt.Key_Space && MovementModifier.move.amount.y != 0)
		MovementModifier.move.amount = new float3(0,0,0);

	else if (e.keyCode == Qt.Key_C && MovementModifier.move.amount.y != 0)
		MovementModifier.move.amount = new float3(0,0,0);
	},

	/**
	 * Handler for mouse events
	 * @method HandleMouse
	 * @param e {MouseEvent}
 	 */
	HandleMouse: function(e)
	{
		// RMB handler
		if (e.IsButtonDown(2) && !input.IsMouseCursorVisible())
		{
			mouselook = true;
			if (e.relativeX != 0)
				this.HandleMouseLookX(e.relativeX);
			if (e.relativeY != 0)
				this.HandleMouseLookY(e.relativeY);
		}
		// LMB handler
		else if (e.IsButtonDown(1))
			this.ChangeForwardDirectionByMouse(e.relativeX)

		else if (e.GetEventType() == 4)
			mouselook = false;
	},

	/**
	 * Handler for mouse x axis relative movement (rotate camera)
	 * @method HandleMouseLookX
	 * @param param {Number}
	 */
	HandleMouseLookX: function(param)
	{
		voidTransform = voidEntity.placeable.transform;
		voidTransform.rot.y -= MovementModifier.rotate.sensitivity * parseInt(param);
		voidEntity.placeable.transform = voidTransform; // sets new rotation
		azimuth = -(voidTransform.rot.y)%360;
		if (azimuth < 0)
			azimuth = 360 + azimuth;
		compass.setRotation(-azimuth);
		//compass.setRotation((voidTransform.rot.y)%360);
		widget2.text = "Azimuth: " + azimuth.toFixed(2);
		//widget2.text = "Azimuth: " +(-(voidTransform.rot.y)%360).toFixed(2);
	},

	// Handler for mouse y axis relative movement
	/**
	 * Description
	 * @method HandleMouseLookY
	 * @param param {Number}
	 * @return
	 */
	HandleMouseLookY: function(param)
	{
		voidTransform = voidEntity.placeable.transform;
		radians = (sector-1)*60*Math.PI/180;
		voidTransform.rot.x -= MovementModifier.rotate.sensitivity * parseInt(param);
		if (voidTransform.rot.x > 90.0)
			voidTransform.rot.x = 90.0;
		if (voidTransform.rot.x < -90.0)
			voidTransform.rot.x = -90.0;
		voidEntity.placeable.transform = voidTransform;
	},

	/**
	 * Changes forward direction and rotate 3D Arrow by RMB
	 * @method ChangeForwardDirectionByMouse
	 * @param param {Number}
	 */
	ChangeForwardDirectionByMouse: function(param)
	{
		var increase = param/rect.width()*120;
		if (param < 0 && direction+increase < 10 && direction+increase > 0)	// snap to zero
			direction = 0;
		else if (param > 0 && direction+increase > 350)						// snap to zero
			direction = 0;
		else if (direction+increase < 0)
			direction = 360+increase;
		else if (direction+increase > 360)
			direction = increase;
		else
			direction = direction+increase;
		widget3.text = "Direction of travel: " +direction.toFixed(2);
		widget4.text = "Sector: " + parseInt((direction/60)+1);

		arrow3DTransform = arrow3D.placeable.transform;
		arrow3DTransform.rot.y = -90-direction;
		arrow3D.placeable.transform = arrow3DTransform;
		voidEntity.Exec(5, "MSG_ROTATE_ARROW", direction);
	},

	/**
	 * Displays compass and compass needle on screen
	 * @method drawCompass
	 */
	drawCompass: function()
	{
		/**
		 * This path specifies a local filename from which this asset can be reloaded if necessary.
		 * @method asset.GetAsset(path+filename).DiskSource
		 */
		var pmCompass = new QPixmap(asset.GetAsset("compass.png").DiskSource());
		var pmNeedle = new QPixmap(asset.GetAsset("needle.png").DiskSource());

		/**
		 * Creates and adds a pixmap item to the scene.
		 * @method ui.GraphicsScene().addPixmap
		 * @param pixmap {QPixmap}
		 */
		compass = ui.GraphicsScene().addPixmap(pmCompass);
		needle = ui.GraphicsScene().addPixmap(pmNeedle);

		/**
		 * Sets transformation origin point. For example for standard rotation, set x and y values to the center of image.
		 * @method QPixmap.setTransformOriginPoint
		 * @param x {Number}
		 * @param y {Number}
		 */
		compass.setTransformOriginPoint(pmCompass.width()/2, pmCompass.height()/2);
	},

	/**
	 * Remove FreeLookCamera from the scene
	 * @method removeFreeLookCamera
	 */
	removeFreeLookCamera: function()
	{
		var freelookcamera = scene.GetEntityByName("FreeLookCamera");
		if (freelookcamera)
		{
			scene.RemoveEntity(freelookcamera.id,'');
			Log("**** FreeLookCamera entity removed");
		}
	},

	/**
	 * Shows status messages in widget5
	 * @method UpdateStatus
	 * @param text {String}
	 */
	UpdateStatus: function(text)
	{
		widget5.text = text;
	}
});

// Startup
_masterClientInstance = new MasterClass();

// EOF
