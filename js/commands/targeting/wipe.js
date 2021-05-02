function CommandRegistration()
{
	RegisterCommand( "wipe", 3, true );
	RegisterCommand( "iwipe", 3, true );
}

function command_WIPE( socket, cmdString )
{
	iWipe = false;
	CallWipe( socket, cmdString );
}

function command_IWIPE( socket, cmdString )
{
	iWipe = true;
	CallWipe( socket, cmdString );
}

function CallWipe( socket, cmdString )
{
	all	= false;
	if( cmdString )
	{
		var splitString = cmdString.split( " " );
		if( splitString[3] )
		{
			socket.clickX = parseInt( splitString[0] );
			socket.clickY = parseInt( splitString[1] );
			socket.SetWord( 11, parseInt( splitString[2] ) );
			socket.SetWord( 13, parseInt( splitString[3] ) );
			DoWipe( socket, null );
		}
		else if( splitString[0] )
		{
			var mChar	= socket.currentChar;
			all		= true;
			var uKey 	= splitString[0].toUpperCase();
			var saidAll 	= ( uKey == "ALL" );
			var counter	= 0;
			var counterStr	= "";
			isItem = false;
			isSpawner = false;
			isMulti = false;
			isBoat = false;
			isNPC = false;
			socket.SysMessage( "Wiping " + uKey );
			Console.PrintSectionBegin();
			if( saidAll || uKey == "ITEMS" )
			{
				Console.Print( mChar.name + " has initiated an item wipe.\n" );
				isItem 		= true;
				counter 	= IterateOver( "ITEM" );
				counterStr 	= counter.toString();
				Console.Print( "Item wipe deleted " + counterStr + " items.\n" );
				socket.SysMessage( "Wiped " + counterStr + " items" );
			}
			else if( uKey == "MULTIS" )
			{
				Console.Print( mChar.name + " has initiated a multi wipe.\n" );
				isMulti 	= true;
				counter 	= IterateOver( "MULTI" );
				counterStr 	= counter.toString();
				Console.Print( "Multi wipe deleted " + counterStr + " multis.\n" );
				socket.SysMessage( "Wiped " + counterStr + " multis" );
			}
			else if( uKey == "BOATS" )
			{
				Console.Print( mChar.name + " has initiated a boat wipe.\n" );
				isBoat 	= true;
				counter 	= IterateOver( "BOAT" );
				counterStr 	= counter.toString();
				Console.Print( "Boat wipe deleted " + counterStr + " boats.\n" );
				socket.SysMessage( "Wiped " + counterStr + " boats" );
			}
			else if( saidAll || uKey == "NPCS" )
			{
				Console.Print( mChar.name + " has initiated a npc wipe.\n" );
				isNPC 		= true;
				counter 	= IterateOver( "CHARACTER" );
				counterStr 	= counter.toString();
				Console.Print( "NPC wipe deleted " + counterStr + " npcs.\n" );
				socket.SysMessage( "Wiped " + counterStr + " npcs" );
			}
			else if( saidAll || uKey == "SPAWNERS" )
			{
				Console.Print( mChar.name + " has initiated a spawner wipe.\n" );
				isSpawner	= true;
				counter 	= IterateOver( "SPAWNER" );
				counterStr 	= counter.toString();
				Console.Print( "Spawner wipe deleted " + counterStr + " spawners.\n" );
				socket.SysMessage( "Wiped " + counterStr + " spawners" );
			}
			else
			{
				socket.SysMessage( "Invalid parameter. Valid params: all / items / npcs / spawners / (x1 y1 x2 y2)")
			}
			Console.PrintDone();
		}
	}
	else
	{
		socket.clickX = -1;
		socket.clickY = -1;
		socket.CustomTarget( 0, "Choose top corner to wipe" );
	}
}

function onCallback0( socket, ourObj )
{
	// If user cancels targeting with Escape, ClassicUO still sends a targeting response (unlike
	// regular UO client), but one byte in the packet is always 255 when this happens
	var cancelCheck = parseInt( socket.GetByte( 11 ));
	if( cancelCheck != 255 )
	{
		socket.clickX 	= socket.GetWord( 11 );
		socket.clickY 	= socket.GetWord( 13 );
		socket.CustomTarget( 1, "Choose bottom corner to wipe" );
	}
}

function onCallback1( socket, ourObj )
{
	// If user cancels targeting with Escape, ClassicUO still sends a targeting response (unlike
	// regular UO client), but one byte in the packet is always 255 when this happens
	var cancelCheck = parseInt( socket.GetByte( 11 ));
	if( cancelCheck != 255 )
	{
		DoWipe( socket, ourObj );
	}
	else
	{
		socket.clickX = 0;
		socket.clickY = 0;
	}
}

function DoWipe( socket, ourObj )
{
	var mChar = socket.currentChar;
	x1 = socket.clickX;
	y1 = socket.clickY;
	x2 = socket.GetWord( 11 );
	y2 = socket.GetWord( 13 );
	var tmpLoc;
	if( x1 > x2 )
	{
		tmpLoc 	= x1;
		x1 	= x2;
		x2	= tmpLoc;
	}
	if( y1 > y2 )
	{
		tmpLoc 	= y1;
		y1 	= y2;
		y2 	= tmpLoc;
	}

	Console.PrintSectionBegin();
	Console.Print( mChar.name + " has initiated a wipe.\n" );
	socket.SysMessage( "Wiping.." );
	var counter 	= IterateOver( "ITEM" );
	var counterStr	= counter.toString();
	socket.SysMessage( "Wiped " + counterStr + " items" );
	Console.Print( "Wipe deleted " + counterStr + " items.\n" );
	Console.PrintDone();

	socket.clickX = -1;
	socket.clickY = -1;
	x1 	= 0;
	y1 	= 0;
	x2 	= 0;
	y2 	= 0;
	iWipe 	= false;
	all	= false;
	isItem	= false;
}

function onIterate( toCheck )
{
	if( toCheck )
	{
		if( all )
		{
			if( isItem && toCheck.isItem == true && toCheck.isSpawner == false && toCheck.wipable )
			{
				if( toCheck.container == null && toCheck.type != 202 )
				{
					toCheck.Delete();
					return true;
				}
			}
			else if( !isItem && toCheck.isChar == true )
			{
				if( toCheck.npc && toCheck.aitype != 17 && !toCheck.tamed )
				{
					toCheck.Delete();
					return true;
				}
			}
			else if( isSpawner && toCheck.isSpawner == true && toCheck.wipable )
			{
				toCheck.Delete();
				return true;
			}
			else if( isMulti && toCheck.IsMulti() )
			{
				toCheck.Delete();
				return true;
			}
			else if( isBoat && toCheck.IsBoat() )
			{
				toCheck.Delete();
				return true;
			}
		}
		else
		{
			if( toCheck.isItem == true && toCheck.container == null )
			{
				var toCheckMulti = toCheck.multi;
				if( !toCheckMulti ) //Only wipe items that aren't inside a valid multi
				{
					var shouldWipe 	= iWipe;
					var tX 		= toCheck.x;
					var tY 		= toCheck.y;
					if( tX >= x1 && tX <= x2 && tY >= y1 && tY <= y2 )
						shouldWipe = !iWipe;
					if( shouldWipe )
					{
						toCheck.Delete();
						return true;
					}
				}
			}
		}
	}
	return false;
}
