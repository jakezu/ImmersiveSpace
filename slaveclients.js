engine.IncludeFile("local://class.js"); // from jsmodules/lib

var _p = null;
var voidentity = scene.GetEntityByName("Void");
var slavecamera;
var sector = 1;
var fov = 38.5;
var pixmap_arrow = new QPixmap();
var arrow = new QPixmap();
//var label = new QLabel();
//var proxy = new UiProxyWidget(label);
var distance_to_north = 10000;
//ui.AddProxyWidgetToScene(proxy);
//var ID; // commented 1.8.2013, needed?
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
		//this.setSpawnPoint();
		
		this.removeFreeLookCamera();
		
		// Signals
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
		voidentity.Action("ChangeForwardDirectionMsg").Triggered.connect(this, this.ChangeForwardDirection);
		//voidentity.Action("ChangeFovMsg").Triggered.connect(function(fov) {widget5.text = "Field of vision: "+fov;});
		voidentity.Action("ChangeFovMsg").Triggered.connect(this, this.ChangeFov);
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
		//proxy.windowFlags = Qt.Widget;
		//mainWidget.setStyleSheet("QLabel {background-color: transparent; color: black; font-size: 16px; opacity: 0,2;}");
		mainWidget.setStyleSheet("QLabel {color: black; font-size: 14px;}");
		widget1.setStyleSheet("QLabel {color: blue; font-size: 18px; font-weight: bold;}");
		rect = ui.GraphicsScene().sceneRect;
		proxy.windowFlags = 0;
		proxy.visible = true;
		proxy.y = 10;
		proxy.x = rect.width()-mainWidget.width-10;
		//proxy.x = 400;
		//widget2.text = mainWidget.width;
		mainWidget.setWindowOpacity(0.3);
		//this.windowResized(rect);
	},

	ChangeFov: function(fov)
	{
		slavecamera.verticalFov = fov;
		widget5.text = "Field of vision: "+fov;
	},
	
	windowResized: function(rect)
	{
		//this.statusWidget(rect.width());
		if (!arrow.isNull)
			arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		proxy.x = rect.width()-mainWidget.width-10;
	},	
	
	/*
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		this.statusWidget(parseInt(sector)+1);
		if ((parseInt(sector)+1) == client_ID) // SlaveClient's ID
		{
			//ui.GraphicsScene().addPixmap(pixmap_arrow);
			this.drawForwardIndicator();
			//this.statusWidget("Kulkusuunta");
		}
		//else
		//	this.statusWidget("Kulkusuunta client"+sector+":llä");
	},
	*/
	
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		var ID = parseInt(sector)+1;
		//if ((parseInt(sector)+1) == client_ID) // SlaveClient's ID
		if (ID == client_ID) // SlaveClient's ID
		{
			//ui.GraphicsScene().addPixmap(pixmap_arrow);
			this.drawForwardIndicator();
			//this.statusWidget("Kulkusuunta");
			widget2.text = "Direction of travel";
		}
		else
			//this.statusWidget("Kulkusuunta client"+sector+":llä");
			widget2.text = "Direction of travel: client"+ID;
	},	

	// Create SlaveClient-entity which gets placeable data from the server
	createSlaveClient: function()
	{
		slaveclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		slaveclient.SetName("SlaveClient");
		slaveclient.SetTemporary(true);
		var placeable = slaveclient.placeable;
		//var voidentity = scene.GetEntityByName("Void");
		
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
		
		// Field of vision (45 = default, 38.5 is good in one particular setup)
		slavecamera.verticalFov = 38.5;
		
		// Get client's ID number
		var regexp = /\d/;
		client_ID = regexp.exec(client.LoginProperty("username"));
		widget1.text = "Client" + client_ID + " (SlaveClient)";
		//var ID = slaveClientID - 1;
		
		
		// Rotate camera by ID * 60 degrees (when rotated to clockwise, negative y-axis value is needed)
		transform.rot.y = -(client_ID-1) * 60;
		placeable.transform = transform;
		
		slavecamera.SetActive();
		
		Log("**** SlaveCamera has been set and rotated by " + (client_ID-1)*60 + " degrees clockwise");
		
	},
	
	drawForwardIndicator: function(angle)
	{
		//var pixmap_arrow = new QPixmap(asset.GetAsset("arrow3b.png").DiskSource());
		pixmap_arrow = new QPixmap(asset.GetAsset("arrow3b.png").DiskSource());
		//var arrow = ui.GraphicsScene().addPixmap(pixmap_arrow);
		arrow = ui.GraphicsScene().addPixmap(pixmap_arrow);
		//arrow.setPos(resolution.width()/2-(135/2),resolution.height()-pixmap_arrow.height());
		rect = ui.GraphicsScene().sceneRect;
		arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
	},

	/*
	statusWidget: function(message, row){
		if (typeof(row)==='undefined') 
			row=0;
		label.indent = 10;
		label.text = message;
		label.setStyleSheet("QLabel {background-color: transparent; color: white; font-size: 16px; }");
		proxy.x = 10;
		proxy.y = 200+row*20;
		proxy.windowFlags = 0;
		proxy.visible = true;
	},
	*/	
	
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
