engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");
var slaveclient;
var slavecamera;
var sector = 1;
var fov = 38.5; // Field of vision (45 = default, 38.5 is good in one particular setup)
var pixmap_arrow = new QPixmap();
var arrow = new QPixmap();
var client_ID;
var proxy = new UiProxyWidget();
var mainWidget = new QWidget();
var widget1 = new QLabel();
var widget2 = new QLabel();
var widget3 = new QLabel();
var widget4 = new QLabel();
var widget5 = new QLabel();


var SlaveClient = Class.extend
({
	init: function()
	{

		Log("**** Creating slave client objects");

		this.setWidgetLayout();
		this.createSlaveClient();
		this.setSlaveCamera();
		this.removeFreeLookCamera();
		
		// Signals
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
		voidentity.Action("ChangeForwardDirectionMsg").Triggered.connect(this, this.ChangeForwardDirection);
		voidentity.Action("ChangeFovMsg").Triggered.connect(this, this.ChangeFov);
		voidentity.Action("ChangeParentEntityRefMsg").Triggered.connect(this, this.setParentEntityRef);
	},
	
	setWidgetLayout: function()
	{
		var layout = new QVBoxLayout();
		mainWidget.setLayout(layout);
		mainWidget.setFixedWidth(250);
		layout.addWidget(widget1, 0, 1);
		layout.addWidget(widget2, 0, 1);
		layout.addWidget(widget3, 0, 1);
		layout.addWidget(widget4, 0, 1);
		layout.addWidget(widget5, 0, 1);
        layout.setContentsMargins(10,0,10,5);
        layout.setSpacing(2);
		proxy = ui.AddWidgetToScene(mainWidget);
		//mainWidget.setStyleSheet("QLabel {background-color: transparent; color: black; font-size: 16px; opacity: 0,2;}");
		mainWidget.setStyleSheet("QLabel {color: black; font-size: 14px;}");
		widget1.setStyleSheet("QLabel {color: blue; font-size: 18px; font-weight: bold;}");
		rect = ui.GraphicsScene().sceneRect;
		//proxy.windowFlags = Qt.Widget;
		proxy.windowFlags = 0;
		proxy.visible = true;
		proxy.y = 10;
		proxy.x = rect.width()-mainWidget.width-10;
		mainWidget.setWindowOpacity(0.3);
	},
	
	setParentEntityRef: function(attribute)
	{
		//var entity = scene.GetEntityById(attribute);
		var component = slaveclient.GetComponent("EC_Placeable");
		//slaveclient.placeable.SetParent(attribute, preserveWorldTransform=false);
		//slaveclient.placeable.SetParent(entity, preserveWorldTransform=false);
		//component.SetAttribute("Parent entity ref", parseInt(attribute));
		//var attrib = component.GetAttribute("Parent entity ref");
		//var attrib = component.GetAttribute("name");
		//var attrib = slaveclient.placeable.GetAttribute("name");
		//attrib.SetAttribute("value", attribute);
		widget2.text = slaveclient.components["EC_Placeable"].GetAttribute("Parent entity ref");
	},

	ChangeFov: function(fov)
	{
		slavecamera.verticalFov = fov;
		widget5.text = "Field of vision: "+fov.toFixed(2);
	},
	
	windowResized: function(rect)
	{
		if (!arrow.isNull)
			arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		proxy.x = rect.width()-mainWidget.width-10;
	},	
	
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		var ID = parseInt(sector)+1;
		if (ID == client_ID) // SlaveClient's ID
		{
			this.drawForwardIndicator();
			widget2.text = "Direction of travel";
		}
		else
			widget2.text = "Direction of travel: client"+ID;
	},	

	// Create SlaveClient-entity which gets placeable data from the server
	createSlaveClient: function()
	{
		slaveclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		//slaveclient.SetName("SlaveClient");
		slaveclient.SetName("SlaveCamera");
		slaveclient.SetTemporary(true);
		var placeable = slaveclient.placeable;
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** SlaveClient entity has been created with placeable, camera and name components");
	},
	
	// Set SlaveCamera parameters
	setSlaveCamera: function()
	{
		slavecamera = slaveclient.camera;
		var placeable = slaveclient.placeable;
		var transform = placeable.transform;
		
		slavecamera.verticalFov = fov;
		
		// Get client's ID number
		var regexp = /\d/;
		client_ID = regexp.exec(client.LoginProperty("username"));
		widget1.text = "Client" + client_ID + " (SlaveClient)";
		
		// Rotate camera by ID * 60 degrees (when rotated to clockwise, negative y-axis value is needed)
		transform.rot.y = -(client_ID-1) * 60;
		placeable.transform = transform;
		
		slavecamera.SetActive();
		
		Log("**** SlaveCamera has been set and rotated by " + (client_ID-1)*60 + " degrees clockwise");
		
	},
	
	drawForwardIndicator: function(angle)
	{
		pixmap_arrow = new QPixmap(asset.GetAsset("arrow3b.png").DiskSource());
		arrow = ui.GraphicsScene().addPixmap(pixmap_arrow);
		rect = ui.GraphicsScene().sceneRect;
		arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
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
_p = new SlaveClient();

// EOF
