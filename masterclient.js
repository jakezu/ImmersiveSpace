engine.IncludeFile("local://class.js"); // from jsmodules/lib

engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
engine.ImportExtension("qt.webkit");


// Globals
var _p = null;
var mastercamera;
var fov = 38.5;
var sector = 0;
var voidentity = scene.GetEntityByName("Void");
var compass = new QPixmap();
var pixmap_arrow = new QPixmap();
var arrow = new QPixmap();
var angle = 0;
var compass_angle = 0;
var distance_to_north = 10000;
var proxy = new UiProxyWidget();
var mainWidget = new QWidget();
var widget1 = new QLabel();
var widget2 = new QLabel();
var widget3 = new QLabel();
var widget4 = new QLabel();
var widget5 = new QLabel();


var _g =
{
	connected : false,
	rotate :
	{
		sensitivity : 0.3
		//sensitivity : 1.0
	},
	move :
	{
		sensitivity : 20.0,
		amount : new float3(0,0,0)
	},
	motion : new float3(0,0,0),
};


var MasterClient = Class.extend
({
	init: function()
	{

		// Connect frame updates and enabled inputmapper
		frame.Updated.connect(this, this.Update);
		
		Log("**** Creating master client objects");
		widget1.text = "Client1 (MasterClient)";

		this.setWidgetLayout();

		this.removeFreeLookCamera();
		this.createMasterClient();
		this.setMasterCamera();
		this.setSpawnPoint();
		this.createInputHandler();
		//this.statusWidget();
		//this.statusWidget2();
		this.drawCompass();
		this.drawForwardIndicator();
		
		// Signals
		voidentity.Action("ChangeForwardDirectionMsg").Triggered.connect(this, this.ChangeForwardDirection);
		ui.GraphicsScene().sceneRectChanged.connect(this, this.windowResized);
		
	},
	
	setWidgetLayout: function()
	{
		var layout = new QVBoxLayout();
		//var mainWidget = new QWidget();
		mainWidget.setLayout(layout);
		//var widget1 = new QLabel();
		//var widget2 = new QLabel();
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
		mainWidget.setWindowOpacity(0.3);
		//widget1.text = mainWidget.width;
		//widget2.text = rect.width();
	},
	
	ChangeForwardDirection: function(sector)
	{
		ui.GraphicsScene().removeItem(arrow);
		if ((parseInt(sector)+1) == 1) // MasterClient's ID
		{
			//ui.GraphicsScene().addPixmap(pixmap_arrow);
			this.drawForwardIndicator();
			//this.statusWidget("Kulkusuunta");
			widget2.text = "Direction of travel";
		}
		else
			//this.statusWidget("Kulkusuunta client"+sector+":llä");
			widget2.text = "Direction of travel: client"+sector;
	},
	
	windowResized: function(rect)
	{
		//this.statusWidget(rect.width());
		arrow.setPos(rect.width()/2-(135/2),rect.height()-pixmap_arrow.height());
		proxy.x = rect.width()-mainWidget.width-10;
	},
	
	WindowResizeListener: function(widg, callbackFunction)
	{
		widg.WindowResized = callbackFunction;
		var gscene = ui.GraphicsScene().scene();
		gscene.sceneRectChanged.connect(widg, widg.WindowResized);		
	},
	
	/*
	WindowResizeListener: function(ui.GraphicsScene(), callbackFunction)
	{
		ui.GraphicsScene().sceneRectChanged.connect(ui.GraphicsScene(), ui.GraphicsScene.WindowResized);
	},
	*/
	
	Update: function(frametime)
	{
		profiler.BeginBlock("FreeLookCamera_Update");

		if (_g.move.amount.x == 0 && _g.move.amount.y == 0 && _g.move.amount.z == 0)
		{
			profiler.EndBlock();
			return;
		}

		_g.motion.x = _g.move.amount.x * _g.move.sensitivity * frametime;
		_g.motion.y = _g.move.amount.y * _g.move.sensitivity * frametime;
		_g.motion.z = _g.move.amount.z * _g.move.sensitivity * frametime;
		
		_g.motion = voidentity.placeable.Orientation().Mul(_g.motion);
		voidentity.placeable.SetPosition(voidentity.placeable.Position().Add(_g.motion));

		profiler.EndBlock();
	},

	// Create MasterClient-entity which gives placeable data for the clients
	createMasterClient: function()
	{
		masterclient = scene.CreateLocalEntity(["EC_Placeable", "EC_Camera", "EC_Name"]);

		masterclient.SetName("MasterClient");
		masterclient.SetTemporary(true);
		var placeable = masterclient.placeable;
		//var voidentity = scene.GetEntityByName("Void");
		
		// set parenting reference to the Server's Void-entity
		placeable.SetParent(voidentity, preserveWorldTransform=false);
		
		Log("**** MasterClient entity has been created with placeable, camera and name components");
	},

	// Set MasterCamera parameters
	setMasterCamera: function()
	{
		//var mastercamera = masterclient.camera;
		mastercamera = masterclient.camera;
		
		// Field of vision (45 = default, 38.5 is good in one particular setup)
		mastercamera.verticalFov = 38.5;
		mastercamera.SetActive();
		widget5.text = "Field of vision: "+fov;
	},
	
	// Set initial spawn point
	setSpawnPoint: function()
	{
		var void_placeable = voidentity.placeable;
		var void_transform = void_placeable.transform;
		void_transform.pos = new float3(0, 20, 0);
		voidentity.placeable.transform = void_transform;
	},
	
	// Create handler for keyboard and mouse events
	createInputHandler: function()
	{
		var inputContext = input.RegisterInputContextRaw("FreeLookCamera", 101);
		inputContext.takeMouseEventsOverQt = true;
		inputContext.KeyPressed.connect(this, this.HandleKeyPress);
		inputContext.KeyReleased.connect(this, this.HandleKeyRelease);
		inputContext.MouseEventReceived.connect(this, this.HandleMouse);
		Log("**** InputHandler initialized...");
	},
	
	// Handler for key press commands 
	HandleKeyPress: function(e)
	{
		//var radians = (sector-1)*60*Math.PI/180;
		//var radians = -angle*Math.PI/180;
		var radians = angle*Math.PI/180;
		
		// forward
		if (e.keyCode == Qt.Key_W)
		{
			//_g.move.amount.z = -1;
			_g.move.amount.z = -Math.cos(radians);
			_g.move.amount.x = Math.sin(radians);
		}
		
		// backward
		else if (e.keyCode == Qt.Key_S)
		{
			//_g.move.amount.z = 1;
			_g.move.amount.z = Math.cos(radians);
			_g.move.amount.x = -Math.sin(radians);
		}
		
		// right
		else if (e.keyCode == Qt.Key_D)
		{
			//_g.move.amount.x = 1;
			_g.move.amount.z = Math.sin(radians);
			_g.move.amount.x = Math.cos(radians);
			angle+=(Math.atan(Math.cos(radians)/distance_to_north))*(180/Math.PI);
			if (angle > 360)
				angle -= 360;
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			//this.statusWidget(-angle);
			widget4.text = "Bearing: " +(angle).toFixed(2);
		}
		
		// left
		else if (e.keyCode == Qt.Key_A)
		{
			//_g.move.amount.x = -1;
			_g.move.amount.z = -Math.sin(radians);
			_g.move.amount.x = -Math.cos(radians);
			angle-=(Math.atan(Math.cos(radians)/distance_to_north))*(180/Math.PI);
			if (angle < 0)
				angle += 360;
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget4.text = "Bearing: " + (angle).toFixed(2);
		}
		
		// up
		else if (e.keyCode == Qt.Key_Space)
			_g.move.amount.y = 1;
		
		// down
		else if (e.keyCode == Qt.Key_C)
			_g.move.amount.y = -1;
		
		// change sector +
		else if (e.keyCode == Qt.Key_Plus)
		{
			if (sector < 5)
				sector++;
			else
				sector = 0;
			angle = sector*60;
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
		}
		
		// change sector -
		else if (e.keyCode == Qt.Key_Minus)
		{
			if (sector > 0)
				sector--;
			else
				sector = 5;
			angle = sector*60;
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
			compass_angle = -angle;
			compass.setRotation(compass_angle);
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
		}
		
		// increse vertical fov
		else if (e.keyCode == Qt.Key_Insert)
		{
			fov += 2.5;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov;
		}
		
		// minor increse vertical fov
		else if (e.keyCode == Qt.Key_Home)
		{
			fov += 0.25;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov;
		}		
		
		// decrease vertical fov
		else if (e.keyCode == Qt.Key_Delete)
		{
			fov -= 2.5;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov;
		}
		
		// minor decrease vertical fov
		else if (e.keyCode == Qt.Key_End)
		{
			fov -= 0.25;
			mastercamera.verticalFov = fov;
			widget5.text = "Field of vision: "+fov;
		}			

		// Reset direction
		else if (e.keyCode == Qt.Key_R)
		{
			var transform = voidentity.placeable.transform;
			transform.rot.y = 0;
			voidentity.placeable.transform = transform;
			sector = 0;
			angle = 0;
			compass_angle = -angle;
			compass.setRotation(compass_angle);			
			widget3.text = "Sector: "+sector;
			widget4.text = "Bearing: " +parseInt(angle);
			voidentity.Exec(5, "ChangeForwardDirectionMsg", sector);
		}
		
	},
	
	// Handler for key release commands
	HandleKeyRelease: function(e)
	{
	
	//if (e.keyCode == Qt.Key_W && _g.move.amount.z == -1)
	if (e.keyCode == Qt.Key_W && _g.move.amount.z != 0 )
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_S && _g.move.amount.z == 1)
	else if (e.keyCode == Qt.Key_S && _g.move.amount.z != 0)
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_D && _g.move.amount.x == 1)
	else if (e.keyCode == Qt.Key_D && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
		
	//else if (e.keyCode == Qt.Key_A && _g.move.amount.x == -1)
	else if (e.keyCode == Qt.Key_A && _g.move.amount.x != 0)
		_g.move.amount = new float3(0,0,0);
	
	//else if (e.keyCode == Qt.Key_Space && _g.move.amount.y == 1)
	else if (e.keyCode == Qt.Key_Space && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
		
	//else if (e.keyCode == Qt.Key_C && _g.move.amount.y == -1)
	else if (e.keyCode == Qt.Key_C && _g.move.amount.y != 0)
		_g.move.amount = new float3(0,0,0);
	},

	// Handler for mouse events
	HandleMouse: function(e)
	{
		//this.statusWidget(e.relativeX);
		if (e.IsButtonDown(2) && !input.IsMouseCursorVisible())
		{
			if (e.relativeX != 0)
				this.HandleMouseLookX(e.relativeX);
			if (e.relativeY != 0)
				this.HandleMouseLookY(e.relativeY);
		}
	},

	// Handler for mouse x axis relative movement
	HandleMouseLookX: function(param)
	{
		//widget5.text = param;
		var transform = voidentity.placeable.transform;
		transform.rot.y -= _g.rotate.sensitivity * parseInt(param);
		voidentity.placeable.transform = transform;
		if ((angle+_g.rotate.sensitivity * parseInt(param)) > 360)
			angle += (_g.rotate.sensitivity * parseInt(param)) - 360;
		else if ((angle+_g.rotate.sensitivity * parseInt(param)) < 0)
			angle += (_g.rotate.sensitivity * parseInt(param)) + 360;
		else
			angle += _g.rotate.sensitivity * parseInt(param);
		compass_angle = -angle;
		compass.setRotation(compass_angle);
		//this.statusWidget(angle);
		widget4.text = "Bearing: " +angle.toFixed(2);
		//Log(angle);
	},

	// Handler for mouse y axis relative movement
	HandleMouseLookY: function(param)
	{
		var transform = voidentity.placeable.transform;
		var radians = (sector-1)*60*Math.PI/180;
		//transform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		transform.rot.x -= _g.rotate.sensitivity * parseInt(param);
		//transform.rot.y += _g.rotate.sensitivity * parseInt(param);
		//_g.move.amount.z = -Math.cos(radians);
		if (transform.rot.x > 90.0)
			transform.rot.x = 90.0;
		if (transform.rot.x < -90.0)
			transform.rot.x = -90.0;
		voidentity.placeable.transform = transform;
	},
	
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
		/**/
	},
	
	drawCompass: function()
	{
		var pixmap_compass = new QPixmap(asset.GetAsset("compassd.png").DiskSource());
		var pixmap_needle = new QPixmap(asset.GetAsset("needle.png").DiskSource());
		//var pixmap = ui.GraphicsScene().addPixmap(pixmap_compass);
		compass = ui.GraphicsScene().addPixmap(pixmap_compass);
		var needle = ui.GraphicsScene().addPixmap(pixmap_needle);
		compass.setTransformOriginPoint(pixmap_compass.height()/2, pixmap_compass.width()/2);
		//pixmap.setRotation(90);

	},
	
	rotateCompass: function(angle)
	{
		pixmap.setRotation(angle);
		pixmap.setRotation(angle+90);
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
	
	createHUD2: function()
	{
		var uiplane = renderer.CreateUiPlane("HUD");
		//uiplane.SetTexture(asset.GetAsset("compassb.png"));
		uiplane.SetTexture(asset.GetAsset("HiRes2.png"));
		//uiplane.SetTexture(asset.GetAsset("Compass_Rose.jpg"));
		uiplane.Show();
		uiplane.SetWidth(200, true);
		uiplane.SetHeight(200, true);	
		uiplane.SetRotation(45);
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

// EOF
