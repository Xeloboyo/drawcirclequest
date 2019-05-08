var sketch = function( sk ) {

    sk.setup = function() {
        sk.createCanvas(sk.windowWidth, sk.windowHeight);
        sk.addResource("phantom",sk.getFont);
        sk.addResource("frozito",sk.getFont);
        sk.addResource("unseen",sk.getFont);
    };
  
    sk.tick = 0;

    sk.draw = function() {
        var w = sk.windowWidth;
        var h = sk.windowHeight;
        sk.tick++;



        sk.background(0);
        sk.push();
        sk.fill(255);
        sk.textAlign(sk.CENTER);
        sk.applyFont("phantom");
        sk.textSize(64);
        sk.text("DC",w/2,h/2);
        sk.applyFont("frozito");
        sk.textSize(24);
        sk.text("quest",w/2,h/2+30);
        
        sk.pop();
        sk.stroke(255);
        sk.noFill();
        //console.log(sk.checkLoading());
        sk.arc(w/2,h/2-15,200,200,0,sk.PI*2.0*sk.checkLoading());
        if(sk.loaded()){
            sk.noStroke();
            sk.loadTextFade+=(1.0-sk.loadTextFade)*0.1;
            sk.fill(255*sk.loadTextFade);
            sk.textAlign(sk.CENTER);
            sk.applyFont("unseen");
            sk.textSize(18);
            sk.text("Welcome "+sk.playerName,w/2,h/2+110);

        }
    };
    /// ANIMATIONS
    sk.loadTextFade = 0;


    /// MAJOR VARIABLES --------------------------------------
    sk.gamestate = 0;

    //RESOURCE RETRIEVAL -------------------------------------------
    sk.httpGetMap = new Map();

    sk.resourceReq = [];
    sk.addResource = function(res, reqFunction){
        sk.resourceReq.push(res);
        reqFunction(res);
    };
    sk.loaded = function()
    {
        return sk.checkLoading()==1;
    }
    sk.checkLoading = function(){
        let total = 0;
        for(let i=0;i<sk.resourceReq.length;i++){
            //console.log("I:",i,"--",sk.httpGetMap.get(sk.resourceReq[i]));
            if(!sk.isUndef(sk.httpGetMap.get(sk.resourceReq[i]))&&(!sk.isUndef(sk.httpGetMap.get(sk.resourceReq[i]).font))){
                total++;
            }
        }
        return total/sk.resourceReq.length;

    };

    sk.isUndef = function(s){
        return typeof s==="undefined";
    }
  
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
            httpGet("/"+getFromServer).then( (message) => {
                    sk.httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            })
    };
    sk.sendToServer = function (sendToServer,value,keyForMap){
            httpPost("/"+sendToServer,value).then( (message) => {
                    sk.httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            })
    }
    
    sk.drawImage = function(key,x,y,w,h){
        if(sk.httpGetMap.has(key)){
                sk.image(sk.httpGetMap.get(key), x,y,w,h);
        }else{
                sk.fill(255,0,255);
                sk.rect(x,y,w,h);
        }
    }
    
    sk.getFont = async function (fontName){
        sk.httpGetMap.set(fontName,sk.loadFont('/font/'+fontName));
    }
    
    sk.applyFont = function(key){
        if(sk.httpGetMap.has(key)){
                sk.textFont(sk.httpGetMap.get(key));
        }
    }
};