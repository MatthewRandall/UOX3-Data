// simple lightsource switching script
// 17/06/2001 Yeshe; yeshe@manofmystery.org

function onUse( pUser, iUsed ) 
{ 
    DoSoundEffect( iUsed, 1, 0x0146, true );
    iUsed.id = 0x142F;
    srcSock = CalcSockFromChar( pUser );
    SysMessage( srcSock, "You extinguish the candle." );
}