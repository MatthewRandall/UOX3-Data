// Pitchers and Bottles - Jugs and Mugs, by Xuri (xuri@sensewave.com)
// Version: 1.6
// Last Updated: June 7th 2007
//
// Script for using pitchers, bottles, jugs, mugs, goblets and glasses
// (Oh yeah, and buckets and water-basins too)
//
// You can pour the contents of any pitcher, bottle of jug into any goblet, mug or glass
// in the game, and when whatever you're pouring from is empty, you can refill it.
// Pitchers can be refilled with water + all beverages (from bottles), as well as milk from cows,
// while empty bottles and jugs can only be refilled with water.
//
// Targeting the ground when pouring will empty the pitcher/bottle/jug.
//
// Todo: Descriptions for how full a liquid container is
scriptID = 2100;

function onUseChecked( pUser, iUsed )
{
	var pSock = pUser.socket;
	var isInRange = pUser.InRange( iUsed, 3 ); //if character is within range of 2 tiles of target
	if( !isInRange )
	{
		pUser.SysMessage( "You are too far away to reach that!" );
		return false;
	}

	if( iUsed.movable == 3 )
	{
		// Item is locked down, make sure only owners, co-owners or friends can use it
		var iMulti = iUsed.multi;
		if( !ValidateObject( iMulti ) || ( !iMulti.IsOnOwnerList( pUser ) && !iMulti.IsOnFriendList( pUser )))
		{
			pSock.SysMessage( GetDictionaryEntry( 1032, pSock.language )); // That is not yours!
			return false;
		}
	}

	pSock.tempObj = iUsed;
	if( !iUsed.GetTag( "ContentsType" ))
	{
		// Setup "ContentsType"-tags for various pitchers/bottles if they don't have one
		setupLiquidObject( iUsed );
	}
	if( iUsed.GetTag( "EmptyGlass" ) == 2 )
	{
		pUser.SysMessage( "It's empty." );
	}
	else if( iUsed.GetTag( "UsesLeft" ) > 0 )
	{
		pUser.CustomTarget( 1, "Where would you like to pour this?" );
	}
	else if( iUsed.GetTag( "ContentsType" ) == 1 && iUsed.GetTag( "EmptyGlass" ) == 3 )
	{
		pUser.CustomTarget( 0, "Fill from what?" );
	}
	return false;
}

function onCallback0( pSock, myTarget ) // Fill empty Pitchers/bottles/jugs
{
	var pUser = pSock.currentChar;
	var StrangeByte   = pSock.GetWord( 1 );
	var targX	= pSock.GetWord( 11 );
	var targY	= pSock.GetWord( 13 );
	var targZ	= pSock.GetSByte( 16 );
	var tileID	= pSock.GetWord( 17 );
	var Pitcher = pSock.tempObj;
	if(( pUser.x > targX + 3 ) || ( pUser.x < targX - 3 ) || ( pUser.y > targY + 3 ) || ( pUser.y < targY - 3 ) || ( pUser.z > targZ + 15 ) || ( pUser.z < targZ - 15 ))
	{
		pUser.SysMessage( "You are too far away from the target!" );
		return;
	}
	if( !tileID )
	{
		pUser.SysMessage( "It's not possible to fill the pitcher with anything from that." );
		return;
	}
	if( !StrangeByte && myTarget.isChar )
	{
		if(( tileID == 0x00d8 || tileID == 0x00e7 ))
		{
			Pitcher.SetTag( "ContentsName", "milk" );
			Pitcher.SetTag( "ContentsType", 3);
			Pitcher.SetTag( "UsesLeft", 5 );
			switch( Pitcher.id )
			{
				case 0x09a7:case 0x0ff7:
					pUser.SysMessage( "You fill the pitcher with some milk from the cow." );
					Pitcher.id = 0x09ad;
					break;
				case 0x0ff6:
					pUser.SysMessage( "You fill the pitcher with some milk from the cow." );
					Pitcher.id = 0x09f0;
					break;
				case 0x099b:case 0x099f:case 0x09c7:
					pUser.SysMessage( "You fill the bottle with some milk from the cow." );
					Pitcher.name = "bottle of milk";
					break;
				case 0x09c8:
					pUser.SysMessage( "You fill the jug with some milk from the cow." );
					Pitcher.name = "jug of milk";
					Pitcher.SetTag( "UsesLeft", 9 );
					break;
			}
			Pitcher.scripttrigger = scriptID;
			pUser.SoundEffect( 37, 1 );
		}
		else
		{
			pUser.SysMessage( "You cannot fill the pitcher with anything from that character!" );
		}
		return;
	}
	else
	{
		if( !StrangeByte )
		{
			if( Pitcher.serial == myTarget.serial )
			{
				pUser.SysMessage( "Impossible. Can't be done." );
				return;
			}
			//If target hasn't been setup with scripttrigger and the proper tags yet, and
			//it doesn't have any other scripts attached, do so now before anything else
			if( !myTarget.scripttrigger )
			{
				setupLiquidObject( myTarget );
			}
			//Now, if the target is a pitcher/bottle and contains a liquid, move it to our source pitcher!
			if( myTarget.GetTag( "ContentsType" ) > 1 && myTarget.GetTag( "EmptyGlass" ) == 3 )
			{
				var Liquid = myTarget.GetTag( "ContentsName" );
				var ContentsType = myTarget.GetTag( "ContentsType" );
				var ContentsName = myTarget.GetTag( "ContentsName" );
				var UsesLeft = myTarget.GetTag( "UsesLeft" );
				pUser.SoundEffect( 37, 1 );
				switch( Pitcher.id )
				{
				case 0x0ff6:
					pUser.SysMessage( "You fill the pitcher with "+Liquid+"." );
					switchPitcherID( pSock, Pitcher );
					switchPitcherID( pSock, myTarget );
					break;
				case 0x0ff7:case 0x09a7:
					pUser.SysMessage( "You fill the pitcher with "+Liquid+"." );
					switchPitcherID( pSock, Pitcher );
					switchPitcherID( pSock, myTarget );
					break;
				case 0x099b:case 0x099f:case 0x09c7:
					pUser.SysMessage( "You fill the bottle with "+Liquid+"." );
					Pitcher.name = "bottle of "+Liquid;
					switchPitcherID( pSock, myTarget );
					break;
				case 0x09c8:
					pUser.SysMessage( "You fill the jug with "+Liquid+"." );
					Pitcher.name = "jug of "+Liquid;
					switchPitcherID( pSock, myTarget );
					break;
				}
				Pitcher.SetTag( "ContentsType", ContentsType );
				Pitcher.SetTag( "UsesLeft", UsesLeft );
				Pitcher.SetTag( "ContentsName", ContentsName );
				myTarget.SetTag( "ContentsType", 1);
				myTarget.SetTag( "UsesLeft", 0 );
				myTarget.SetTag( "ContentsName", "nothing" );
				return;
			}
		}
		//If target is a source of water
		if( tileID == 0x154d || ( tileID >= 0x0b41 && tileID <= 0x0b44 ) || tileID == 0x0e7b || tileID == 0x0ffa ||
		 ( tileID >= 0x1550 && tileID <= 0x1556 ) || tileID == 0x1558 || tileID == 0x1559 || ( tileID >= 0x1731 &&
		  tileID <= 0x175a ) || ( tileID >= 0x19c3 && tileID <= 0x19ec ))
		{
			pUser.SoundEffect( 37, 1 );
			switch( Pitcher.id )
			{
			case 0x0ff6:
				pUser.SysMessage( "You fill the pitcher with water." );
				Pitcher.id = 0x1f9d;
				Pitcher.SetTag( "ContentsType", 2);
				Pitcher.SetTag( "ContentsName", "water" );
				Pitcher.SetTag( "UsesLeft", 5 );
				break;
			case 0x0ff7:case 0x09a7:
				pUser.SysMessage( "You fill the pitcher with water." );
				Pitcher.id = 0x01f9e;
				Pitcher.SetTag( "ContentsType", 2);
				Pitcher.SetTag( "ContentsName", "water" );
				Pitcher.SetTag( "UsesLeft", 5 );
				break;
			case 0x099b:case 0x099f:case 0x09c7:
				pUser.SysMessage( "You fill the bottle with water." );
				Pitcher.name = "bottle of water";
				Pitcher.SetTag( "ContentsType", 2);
				Pitcher.SetTag( "ContentsName", "water" );
				Pitcher.SetTag( "UsesLeft", 5 );
				break;
			case 0x09c8:
				pUser.SysMessage( "You fill the jug with water." );
				Pitcher.name = "jug of water";
				Pitcher.SetTag( "ContentsType", 2);
				Pitcher.SetTag( "ContentsName", "water" );
				Pitcher.SetTag( "UsesLeft", 9 );
				break;
			}
			return;
		}
		pUser.SysMessage( "It's not possible to fill the pitcher with anything from that." );
	}
}

function onCallback1( pSock, myTarget ) // Pour Full Pitchers somewhere
{
	var pUser = pSock.currentChar;
	var StrangeByte   = pSock.GetWord( 1 );
	var targX	= pSock.GetWord( 11 );
	var targY	= pSock.GetWord( 13 );
	var targZ	= pSock.GetSByte( 16 );
	var tileID	= pSock.GetWord( 17 );
	var UsesLeft;
	var Pitcher = pSock.tempObj;
	if( !tileID )
	{ //If target is the ground
		if(( pUser.x > targX + 3 ) || ( pUser.x < targX - 3 ) || ( pUser.y > targY + 3 ) || ( pUser.y < targY - 3 ) || ( pUser.z > targZ + 15 ) || ( pUser.z < targZ - 15 ))
		{
			pUser.SysMessage( "You are too far away from the target!" );
			return;
		}
		pUser.SoundEffect( 78, 1 );
		//If the container to empty is a glass/goblet/mug
		if(( Pitcher.id >= 0x0995 && Pitcher.id <= 0x099a ) || Pitcher.id == 0x09b3 || Pitcher.id == 0x09bf || Pitcher.id == 0x09ca ||
		Pitcher.id == 0x09cb || Pitcher.id == 0x09ee || Pitcher.id == 0x09ef || ( Pitcher.id >= 0x0ffb && Pitcher.id <= 0x1002 ) ||
		( Pitcher.id >= 0x1f7d && Pitcher.id <= 0x1f80 ) || ( Pitcher.id >= 0x1f85 && Pitcher.id <= 0x1f94 ))
		{
			pUser.SysMessage( "You pour out your drink." );
			Pitcher.SetTag( "EmptyGlass", 2 );
			Pitcher.SetTag( "ContentsName", "nothing" );
			Pitcher.SetTag( "ContentsType", 1 );
			Pitcher.SetTag( "UsesLeft", 0 );
			switchPitcherID( pSock, Pitcher );
			switchGobletID( Pitcher );
		}
		//if the container is a jug
		else if( Pitcher.id == 0x09c8 )
		{
			pUser.SysMessage( "You pour out the contents of the jug." );
			Pitcher.name = "empty jug";
			Pitcher.SetTag( "ContentsType", 1 );
			Pitcher.SetTag( "UsesLeft", 0 );
			Pitcher.SetTag( "ContenstName", "nothing" );
		}
		//if the container is a bottle
		else if( Pitcher.id == 0x099b || Pitcher.id == 0x099f || Pitcher.id == 0x09c7 )
		{
			pUser.SysMessage( "You pour out the contents of the bottle." );
			Pitcher.name = "empty bottle";
			Pitcher.SetTag( "ContentsType", 1 );
			Pitcher.SetTag( "UsesLeft", 0 );
			Pitcher.SetTag( "ContenstName", "nothing" );
		}
		//if the container is a pitcher
		else
		{
			pUser.SysMessage( "You pour out the contents of the pitcher." );
			Pitcher.SetTag( "UsesLeft", 0 );
			Pitcher.SetTag( "ContentsType", 1);
			Pitcher.SetTag( "UsesLeft", 0 );
			Pitcher.SetTag( "ContenstName", "nothing" );
			switchPitcherID( pSock, Pitcher );
		}
	}
	else if( !StrangeByte && myTarget.isChar )
	{ //If target is a character
		if(( pUser.x > targX + 3 ) || ( pUser.x < targX - 3 ) || ( pUser.y > targY + 3 ) || ( pUser.y < targY - 3 ) || ( pUser.z > targZ + 15 ) || ( pUser.z < targZ - 15 ))
		{
			pUser.SysMessage( "You are too far away from the target!" );
			return;
		}
		if( myTarget.serial == pUser.serial )
		{
			//If pitcher is a mug/glass/goblet/etc
			if(( Pitcher.id >= 0x0995 && Pitcher.id <= 0x099a ) || Pitcher.id == 0x09b3 || Pitcher.id == 0x09bf ||
			Pitcher.id == 0x09cb || ( Pitcher.id >= 0x0ffb && Pitcher.id <= 0x1002 )||( Pitcher.id >= 0x1f7d && Pitcher.id <= 0x1f80 )||(
			Pitcher.id >= 0x1f85 && Pitcher.id <= 0x1f94 ))
			{
				pUser.SoundEffect( 48, 1 );
				pUser.DoAction ( 0x22 );
				Pitcher.SetTag( "EmptyGlass", 2 );
				Pitcher.SetTag( "ContentsName", "nothing" );
				Pitcher.SetTag( "ContentsType", 1 );
				Pitcher.SetTag( "UsesLeft", 0 );
				switchPitcherID( pSock, Pitcher );
				switchGobletID( Pitcher );
				return;
			}
			UsesLeft = Pitcher.GetTag( "UsesLeft" );
			if( UsesLeft > 0 )
			{
				UsesLeft = UsesLeft - 1;
				Pitcher.SetTag( "UsesLeft", UsesLeft );
			}
			pUser.SoundEffect( 48, 1 );
			pUser.DoAction ( 0x22 );
			if( UsesLeft <= 0 )
			{
				if( Pitcher.id == 0x09c8 )
				{
					pUser.SysMessage( "The jug is empty!" );
					Pitcher.name = "empty jug";
				}
				else if( Pitcher.id == 0x099b || Pitcher.id == 0x099f || Pitcher.id == 0x09c7 )
				{
					pUser.SysMessage( "The bottle is empty." );
					Pitcher.name = "empty bottle";
				}
				else
				{
					pUser.SysMessage( "The pitcher is empty." );
					switchPitcherID( pSock, Pitcher );
				}
				Pitcher.SetTag( "ContentsType", 1);
				Pitcher.SetTag( "ContentsName", "nothing" );
			}
			return;

		}
		if(( tileID == 0x00d8 || tileID == 0x00e7 ) && ( Pitcher.GetTag( "ContentsType" ) == 3 ))
		{
			pUser.SysMessage( "You can't put the milk back in the cow, fool!" );
		}
		else
		{
			pUser.SysMessage( "You resist the urge to empty the "+Pitcher.GetTag( "ContentsName" )+" over the head of your target." );
		}
		return;
	}
	else if( !StrangeByte )
	{	//If target is an item
		if( Pitcher.serial == myTarget.serial )
		{
			pUser.SysMessage( "Impossible. Can't be done." );
			return;
		}
		//If Target is an open sack of flour, or a bowl of flour
		if( tileID == 0x0aed || tileID == 0x1046 || tileID == 0x154d )
		{

		}
		if(( tileID == 0x0ff8 || tileID == 0xff9) || ( tileID >= 0x1f7d && tileID <= 0x1f80 ) || ( tileID >= 0x1f85 && tileID <= 0x1f94 ) ||
		( tileID >= 0x1f95 && tileID <= 0x1f9e ) || ( myTarget.GetTag( "ContentsType" ) > 1 ))
		{
			pUser.SysMessage( "That is already full! You cannot pour anything into that until it's been emptied." );
			return;
		}
		if( !myTarget.GetTag( "ContentsType" ))
		{
			setupLiquidObject( myTarget );
		}
		//If both source and target containers are goblets/mugs/glasses
		if( Pitcher.GetTag( "EmptyGlass" ) == 1 && ( myTarget.GetTag( "EmptyGlass" ) == 2 )) // || !myTarget.GetTag( "EmptyGlass" ) ) )
		{
			pUser.SoundEffect( 576, 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.SetTag( "ContentsType", Pitcher.GetTag( "ContentsType" ));
			myTarget.SetTag( "ContentsName", Pitcher.GetTag( "ContentsName" ));
			myTarget.SetTag( "UsesLeft", 1 );
			Pitcher.SetTag( "EmptyGlass", 2 );
			Pitcher.SetTag( "ContentsType", 1);
			Pitcher.SetTag( "ContentsName", "nothing");
			Pitcher.SetTag( "UsesLeft", 0 );
			switchTargetID( pSock, myTarget, Pitcher ); //Mark
			switchPitcherID( pSock, Pitcher );
			switchGobletID( Pitcher );
			return;

		}
		//If source container is a pitcher/jug and target is a glass/mug/etc.
		if(( tileID >= 0x1f81 && tileID <= 0x1f84 ) || (tileID >= 0x0995 && tileID <= 0x099a) || tileID == 0x09b3 || tileID == 0x09bf || tileID == 0x09ca ||
		tileID == 0x09cb || tileID == 0x0e78 || tileID == 0x1009 || tileID == 0x0e83 || tileID == 0x14e0 || ( tileID >= 0x0ffb && tileID <= 0x1002 ))
		{
			UsesLeft = Pitcher.GetTag( "UsesLeft" );
			UsesLeft = UsesLeft - 1;
			Pitcher.SetTag( "UsesLeft", UsesLeft );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.SetTag( "ContentsType", Pitcher.GetTag( "ContentsType" ));
			myTarget.SetTag( "ContentsName", Pitcher.GetTag( "ContentsName" ));
			myTarget.SetTag( "UsesLeft", 1 );
			switchTargetID( pSock, myTarget, Pitcher );
			pUser.SoundEffect( 576, 1 );
			if( !UsesLeft )
			{
				if( Pitcher.id == 0x09c8 )
				{
					pUser.SysMessage( "The jug is empty!" );
					Pitcher.name = "empty jug";
					Pitcher.SetTag( "ContentsType", 1);
				}
				else if( Pitcher.id == 0x099b || Pitcher.id == 0x099f || Pitcher.id == 0x09c7 )
				{
					pUser.SysMessage( "The bottle is empty." );
					Pitcher.name = "empty bottle";
					Pitcher.SetTag( "ContentsType", 1);
				}
				else
				{
					pUser.SysMessage( "The pitcher is empty." );
					Pitcher.SetTag( "ContentsType", 1);
					switchPitcherID( pSock, Pitcher );
				}
			}
			return;
		}
		//If target container is empty
		if( myTarget.GetTag( "ContentsType" ) == 1 )
		{
			var Liquid = Pitcher.GetTag( "ContentsName" );
			var ContentsType = Pitcher.GetTag( "ContentsType" );
			var ContentsName = Pitcher.GetTag( "ContentsName" );
			UsesLeft = Pitcher.GetTag( "UsesLeft" );
			myTarget.SetTag( "ContentsType", ContentsType );
			myTarget.SetTag( "ContentsName", ContentsName );
			Pitcher.SetTag( "ContentsType", 1);
			Pitcher.SetTag( "UsesLeft", 0 );
			Pitcher.SetTag( "ContentsName", "nothing" );
			pUser.SoundEffect( 38, 1 );
			switch( myTarget.id )
			{
			case 0x0ff6:case 0x0ff7:case 0x09a7:
				pUser.SysMessage( "You pour the "+Liquid+" into the empty pitcher." );
				if( UsesLeft > 5 )
				{
					UsesLeft = 5;
				}
				myTarget.SetTag( "UsesLeft", UsesLeft );
				switchPitcherID( pSock, myTarget );
				switchPitcherID( pSock, Pitcher );
				break;
			case 0x099b:case 0x099f:case 0x09c7:
				pUser.SysMessage( "You pour the "+Liquid+" into the empty bottle." );
				myTarget.name = "bottle of "+Liquid;
				if( UsesLeft > 5 )
				{
					UsesLeft = 5;
				}
				myTarget.SetTag( "UsesLeft", UsesLeft );
				switchPitcherID( pSock, Pitcher );
				break;
			case 0x09c8:
				pUser.SysMessage( "You pour the "+Liquid+" into the empty jug." );
				myTarget.name = "jug of "+Liquid;
				myTarget.SetTag( "UsesLeft", UsesLeft );
				switchPitcherID( pSock, Pitcher );
				break;
			}


			if(( Pitcher.id >= 0x0995 && Pitcher.id <= 0x099a ) || Pitcher.id == 0x09b3 || Pitcher.id == 0x09bf || Pitcher.id == 0x09ca ||
			Pitcher.id == 0x09cb || Pitcher.id == 0x09ee || Pitcher.id == 0x09ef || ( Pitcher.id >= 0x0ffb && Pitcher.id <= 0x1002 ) ||
			( Pitcher.id >= 0x1f7d && Pitcher.id <= 0x1f80 ) || ( Pitcher.id >= 0x1f85 && Pitcher.id <= 0x1f94 ))
			{
				Pitcher.SetTag( "EmptyGlass", 2 );
				myTarget.SetTag( "UsesLeft", 1 );
				switchPitcherID( pSock, Pitcher );
				switchGobletID( Pitcher );
			}
		}
	}
	else
	{
		pUser.SoundEffect( 78, 1 );
		if(( Pitcher.id >= 0x0995 && Pitcher.id <= 0x09ca )|| Pitcher.id == 0x099a || Pitcher.id == 0x09b3 || Pitcher.id == 0x09bf ||
		Pitcher.id == 0x09cb || ( Pitcher.id >= 0x0ffb && Pitcher.id <= 0x1002 )||( Pitcher.id >= 0x1f7d && Pitcher.id <= 0x1f80 )||(
		Pitcher.id >= 0x1f85 && Pitcher.id <= 0x1f94 ))
		{
			pUser.SysMessage( "You pour out your drink." );
			Pitcher.SetTag( "EmptyGlass", 2 );
			Pitcher.SetTag( "ContentsName", "nothing" );
			Pitcher.SetTag( "ContentsType", 1 );
			switchPitcherID( pSock, Pitcher );
			switchGobletID( Pitcher );
			return;
		}
		if( Pitcher.id == 0x09c8 )
		{
			pUser.SysMessage( "You pour out the contents of the jug, and you're left with an empty jug." );
			Pitcher.name = "empty jug";
			Pitcher.SetTag( "ContentsType", 1 );
			return;
		}
		else if( Pitcher.id == 0x099b || Pitcher.id == 0x099f || Pitcher.id == 0x09c7 )
		{
			pUser.SysMessage( "You pour out the contents of the bottle, and you're left with an empty bottle." );
			Pitcher.name = "empty bottle";
			Pitcher.SetTag( "ContentsType", 1 );
			return;
		}
		else
		{
			pUser.SysMessage( "You pour out the contents of the pitcher, leaving you with an empty pitcher." );
			Pitcher.SetTag( "ContentsType", 1 );
			switchPitcherID( pSock, Pitcher );
			return;
		}
	}
}

function switchTargetID( pSock, myTarget, Pitcher )
{
	switch( myTarget.GetTag( "ContentsType" ))
	{
		//water
		case 2:
			pSock.SysMessage( "You pour some water into the container" );
			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of water";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of water";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of water";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of water";
					break;
				// Empty Glasses
				case 0x1f81:
					myTarget.id = 0x1f91;
					break;
				case 0x1f82:
					myTarget.id = 0x1f92;
					break;
				case 0x1f83:
					myTarget.id = 0x1f93;
					break;
				case 0x1f84:
					myTarget.id = 0x1f94;
					break;
				//basins -> wash basins
				case 0x0e78:case 0x1009:
					myTarget.id = 1008;
					break;
				case 0x0e83: //empty tub -> water tub
					myTarget.id = 0x0e7b;
					Pitcher.SetTag( "UsesLeft", 0 );
					switchPitcherID( pSock, Pitcher );
					break;
				case 0x14e0: // empty bucket -> water bucket
					myTarget.id = 0x0ffa;
					Pitcher.SetTag( "UsesLeft", 0 );
					switchPitcherID( pSock, Pitcher );
					break;

			}
			break;
		// Milk
		case 3:
			pSock.SysMessage( "You pour some milk into the container." );

			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of milk";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of milk";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of milk";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of milk";
					break;
				case 0x1f81:
					myTarget.id = 0x1f89;
					break;
				case 0x1f82:
					myTarget.id = 0x1f8a;
					break;
				case 0x1f83:
					myTarget.id = 0x1f8b;
					break;
				case 0x1f84:
					myTarget.id = 0x1f8c;
					break;
			}
			break;
		//ale
		case 4:
			pSock.SysMessage( "You pour some ale into the container." );
			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of ale";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of ale";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of ale";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of ale";
					break;
				case 0x1f81:case 0x1f82:
					myTarget.id = 0x09ee;
					break;
				case 0x1f83:case 0x1f84:
					myTarget.id = 0x09ef;
					break;
			}
			break;
		//cider
		case 5:
			pSock.SysMessage( "You pour some cider into the container." );
			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of cider";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of cider";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of cider";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of cider";
					break;
				case 0x1f81:
					myTarget.id = 0x1f7d;
					break;
				case 0x1f82:
					myTarget.id = 0x1f7e;
					break;
				case 0x1f83:
					myTarget.id = 0x1f7f;
					break;
				case 0x1f84:
					myTarget.id = 0x1f80;
					break;
			}
			break;
		// Liquor
		case 6:
			pSock.SysMessage( "You pour some liquor into the container." );
			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of liquor";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of liquor";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of liquor";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of liquor";
					break;
				case 0x1f81:
					myTarget.id = 0x1f85;
					break;
				case 0x1f82:
					myTarget.id = 0x1f86;
					break;
				case 0x1f83:
					myTarget.id = 0x1f87;
					break;
				case 0x1f84:
					myTarget.id = 0x1f88;
					break;
			}
			break;
		// Wine
		case 7:
			pSock.SysMessage( "You pour some wine into the glass." );
			switch( myTarget.id )
			{
				//ceramic mugs
				case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca:
					myTarget.name = "ceramic mug of wine";
					break;
				 // goblets
				case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb:
					myTarget.name = "goblet of wine";
					break;
				// skull mugs
				case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe:
					myTarget.name = "skull mug of wine";
					break;
				// pewter mugs
				case 0x0fff:case 0x1000:case 0x1001:case 0x1002:
					myTarget.name = "pewter mug of wine";
					break;
				case 0x1f81:
					myTarget.id = 0x1f8d;
					break;
				case 0x1f82:
					myTarget.id = 0x1f8e;
					break;
				case 0x1f83:
					myTarget.id = 0x1f8f;
					break;
				case 0x1f84:
					myTarget.id = 0x1f90;
					break;
			}
			break;
	}
	return;
}

function switchPitcherID( pSock, Pitcher )
{
	switch( Pitcher.id )
	{
		case 0x09ad:case 0x0ff8:case 0x1f96:case 0x1f98:case 0x1f9a:case 0x1f9c:case 0x1f9e:
			Pitcher.id = 0x0ff7; //right facing
			//Pitcher.name = "empty glass pitcher";
			break;
		case 0x0ff9:case 0x09f0: case 0x1f95:case 0x1f97:case 0x1f99:case 0x1f9b:case 0x1f9d:
			Pitcher.id = 0x0ff6; //left facing�
			//Pitcher.name = "empty glass pitcher";
			break;
		case 0x099b:case 0x099f:case 0x09c7:
			Pitcher.name = "empty bottle";
			break;
		case 0x09c8:
			Pitcher.name = "empty jug";
			break;
		case 0x0ff7:case 0x09a7: //Right facing empty pitchers
			switch( Pitcher.GetTag( "ContentsType" ))
			{
				case 2: // Water
					Pitcher.id = 0x1f9e;
					//Pitcher.name = "pitcher of water";
					break;
				case 3: // Milk
					Pitcher.id = 0x09ad;
					//Pitcher.name = "pitcher of milk";
					break;
				case 4: // Ale
					Pitcher.id = 0x1f96;
					//Pitcher.name = "pitcher of ale";
					break;
				case 5: // Cider
					Pitcher.id = 0x1f98;
					//Pitcher.name = "pitcher of cider";
					break;
				case 6: // Liquor
					Pitcher.id = 0x1f9a;
					//Pitcher.name = "pitcher of liquor";
					break;
				case 7: // Wine
					Pitcher.id = 0x1f9c;
					//Pitcher.name = "pitcher of wine";
					break;
			}
			break;
		case 0x0ff6: //Left facing empty pitcher
			switch( Pitcher.GetTag( "ContentsType" ))
			{
				case 2: // Water
					Pitcher.id = 0x1f9d;
					//Pitcher.name = "pitcher of water";
					break;
				case 3: // Milk
					Pitcher.id = 0x09f0;
					//Pitcher.name = "pitcher of milk";
					break;
				case 4: // Ale
					Pitcher.id = 0x1f95;
					//Pitcher.name = "pitcher of ale";
					break;
				case 5: // Cider
					Pitcher.id = 0x1f97;
					//Pitcher.name = "pitcher of cider";
					break;
				case 6: // Liquor
					Pitcher.id = 0x1f99;
					//Pitcher.name = "pitcher of liquor";
					break;
				case 7: // Wine
					Pitcher.id = 0x1f9b;
					//Pitcher.name = "pitcher of wine";
					break;
			}
			break;
		case 0x1f7d:case 0x1f85:case 0x1f89:case 0x1f8d:case 0x1f91:
			Pitcher.id = 0x1f81;
			break;
		case 0x1f7e:case 0x1f86:case 0x1f8a:case 0x1f8e:case 0x1f92:
			Pitcher.id = 0x1f82;
			break;
		case 0x1f7f:case 0x1f87:case 0x1f8b:case 0x1f8f:case 0x1f93:
			Pitcher.id = 0x1f83;
			break;
		case 0x1f80:case 0x1f88:case 0x1f8c:case 0x1f90:case 0x1f94:
			Pitcher.id = 0x1f84;
			break;
		case 0x0995:case 0x0996: case 0x0997: case 0x0998: case 0x0999: case 0x099a:
			break;
	}
	return;
}

function setupLiquidObject( myTarget )
{
	switch( myTarget.id )
	{
		case 0x09a7:case 0x09d6:case 0x0ff6: case 0x0ff7:
			//Empty pitchers
			myTarget.SetTag( "ContentsType", 1 );
			myTarget.SetTag( "ContentsName", "nothing" );
			myTarget.SetTag( "UsesLeft", 0 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x0ff8:case 0x0ff9:case 0x1f9d:case 0x1f9e:
			//Pitchers of water
			myTarget.SetTag( "ContentsType", 2 );
			myTarget.SetTag( "ContentsType", "water" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x09ad: case 0x09f0:
			//Pitchers of milk
			myTarget.SetTag( "ContentsType", 3 );
			myTarget.SetTag( "ContentsType", "milk" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x1f95:case 0x1f96:
			//Pitchers of ale
			myTarget.SetTag( "ContentsType", 4 );
			myTarget.SetTag( "ContentsType", "ale" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x1f97:case 0x1f98:
		//Pitchers/Jugs of ale
			myTarget.SetTag( "ContentsType", 5 );
			if( myTarget.id == 0x09c8 )
			{
				myTarget.SetTag( "UsesLeft", 9 );
			}
			else
			{
				myTarget.SetTag( "UsesLeft", 5 );
			}
			myTarget.SetTag( "ContentsName", "cider" );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x1f99:case 0x1f9a:
			//Pitchers of liquor
			myTarget.SetTag( "ContentsType", 6 );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "ContentsName", "liquor" );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x1f9b:case 0x1f9c:
			//Pitchers of wine
			myTarget.SetTag( "ContentsType", 7 );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "ContentsName", "wine" );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x099b:
			//Bottle of liquor
			myTarget.SetTag( "ContentsType", 6 );
			myTarget.SetTag( "ContentsName", "liquor" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x099f:
			//Bottle of ale
			myTarget.SetTag( "ContentsType", 4 );
			myTarget.SetTag( "ContentsName", "ale" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x09c7:
			//Bottle of wine
			myTarget.SetTag( "ContentsType", 7 );
			myTarget.SetTag( "ContentsName", "wine" );
			myTarget.SetTag( "UsesLeft", 5 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		case 0x09c8:
			//Bottle of cider
			myTarget.SetTag( "ContentsType", 5 );
			myTarget.SetTag( "ContentsName", "cider" );
			myTarget.SetTag( "UsesLeft", 9 );
			myTarget.SetTag( "EmptyGlass", 3 );
			myTarget.scripttrigger = scriptID;
			break;
		// Full cider-glasses
		case 0x1f7d: case 0x1f7e: case 0x1f7f: case 0x1f80:
			myTarget.SetTag( "ContentsName", "cider" );
			myTarget.SetTag( "ContentsType", 5 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.scripttrigger = scriptID;
			break;
		// Full liquor-glasses
		case 0x1f85: case 0x1f86: case 0x1f87: case 0x1f88:
			myTarget.SetTag( "ContentsName", "liquor" );
			myTarget.SetTag( "ContentsType", 6 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.scripttrigger = scriptID;
			break;
		// Full milk-glasses
		case 0x1f89: case 0x1f8a: case 0x1f8b: case 0x1f8c:
			myTarget.SetTag( "ContentsName", "milk" );
			myTarget.SetTag( "ContentsType", 3 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.scripttrigger = scriptID;
			break;
		//Full wine-glasses
		case 0x1f8d: case 0x1f8e: case 0x1f8f: case 0x1f90:
			myTarget.SetTag( "ContentsName", "wine" );
			myTarget.SetTag( "ContentsType", 7 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.scripttrigger = scriptID;
			break;
		//Full water-glasses
		case 0x1f91: case 0x1f92: case 0x1f93: case 0x1f94:
			myTarget.SetTag( "ContentsName", "water" );
			myTarget.SetTag( "ContentsType", 2 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 1 );
			myTarget.scripttrigger = scriptID;
			break;
		// Empty Glasses, mugs and goblets
		case 0x0995:case 0x0996:case 0x0997:case 0x0998:case 0x0999:case 0x09ca: //ceramic mugs
		case 0x099a:case 0x09b3:case 0x09bf:case 0x09cb: //goblets
		case 0x0ffb:case 0x0ffc:case 0x0ffd:case 0x0ffe: //skullmugs
		case 0x0fff:case 0x1000:case 0x1001:case 0x1002: //pewter mugs
		case 0x1f81:case 0x1f82:case 0x1f83:case 0x1f84: //empty glasses
			myTarget.SetTag( "ContentsName", "nothing" );
			myTarget.SetTag( "ContentsType", 1 );
			myTarget.SetTag( "UsesLeft", 1 );
			myTarget.SetTag( "EmptyGlass", 2 );
			myTarget.scripttrigger = scriptID;
			break;
	}
}

function switchGobletID( Pitcher )
{
	if(( Pitcher.id >= 0x0995 && Pitcher.id <= 0x0999 ) || Pitcher.id == 0x09ca )
	{
		Pitcher.name = "empty ceramic mug";
	}
	if( Pitcher.id >= 0x0ffb && Pitcher.id <= 0x0ffe )
	{
		Pitcher.name = "empty skullmug";
	}
	if( Pitcher.id >= 0x0fff && Pitcher.id <= 0x1002 )
	{
		Pitcher.name = "empty pewter mug";
	}
	if( Pitcher.id == 0x099a || Pitcher.id == 0x09b3 || Pitcher.id == 0x09bf || Pitcher.id == 0x09cb  )
	{
		Pitcher.name = "empty goblet";
	}
}
// Sound Effects:
//38 = "grab" some water with a pitcher
//49 = drinking a little
//50 = drinking a lot
//79 = pouring into/out of something bigger
//577 = liquid sound, pouring into glasses?
//727 = pouring from a bottle


