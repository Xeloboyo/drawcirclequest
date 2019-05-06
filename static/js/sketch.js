var sketch = function( sk ) {

    sk.setup = function() {
        sk.createCanvas(sk.windowWidth, 400);
    };
  
    sk.tick = 0;
  
    sk.draw = function() {
        var w = sk.windowWidth;
        sk.tick++;
        sk.background(0);
        sk.fill(255);
        //sk.stroke(255);
        sk.textSize(32);
        sk.push();
        sk.translate(w/2,200);
        
        var i;
        for(i = 1;i<8;i++){
            sk.push();
            sk.fill(255-i*40,105-i*40,165-i*40)
            sk.rotate(sk.sin(sk.tick*0.1+i*0.05)*0.3);
            sk.text("WELCOME "+sk.playerName+":"+sk.token,-200,0);
            sk.pop();
        }
        sk.rotate(sk.sin(sk.tick*0.1+i*0.05)*0.3);
        sk.text("WELCOME "+sk.playerName+":"+sk.token,-200,0);
        
        sk.pop();
    };
  
    sk.gamestate = 0;
    sk.httpGetMap = new Map();
  
    sk.httpPost= function (theUrl,value){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", theUrl, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
			value: value
	}));

	return xhr.responseText;
    };
    sk.httpGet = function (theUrl)
    {		
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, true ); // false for synchronous request
        xmlHttp.send( null );
        return xmlHttp.responseText;
    };
    sk.getFromServer = function (getFromServer,keyForMap){
            httpGet("https://drawcirclequest.scalingo.io/"+getFromServer).then( (message) => {
                    httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            })
    };
    sk.sendToServer = function (sendToServer,value,keyForMap){
            httpPost("https://drawcirclequest.scalingo.io/"+sendToServer,value).then( (message) => {
                    httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            })
    }
};