class GUIComp{

    constructor(x,y,w,h,c,
                update = function (sk) {
                },
                draw= function (sk) {
                },
                onhover= function (sk) {
                },
                onclick= function (sk) {
                }){
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h;
        this.c=c;
        this.update=update;
        this.draw=draw;
        this.onhover=onhover;
        this.onclick=onclick;

    }
    onhover(sk){}
    onclick(sk){}
    update(sk){}
    draw(sk){}
    inside(mx,my) {
        return mx>this.x&&mx<this.x+this.w&&this.y<my&&my<this.y+this.h;
    }
}

class Button extends GUIComp{
    constructor(x,y,w,h,c,text,onhover,onclick){
        super( x,y,w,h,c,function(sk) {
            this.ani+=(this.state-this.ani)*0.2;
        },function(sk) {
            sk.fill(sk.lerpColor(this.c,sk.color(255),this.ani*0.5));
            sk.rect(this.x,this.y,this.w,this.h);
            sk.fill(sk.lerpColor(sk.color(255),this.c,this.ani-1.0));
            sk.textAlign(sk.CENTER,sk.CENTER);
            sk.text(text,this.x,this.y,this.w,this.h);
        },onhover,onclick );
        this.ani = 0;
        this.state = 0;
    }

}




var sketch = function( sk ) {

    sk.guiList = [
        [], //screen 0 - loading
        [], //screen 1 - game menu?
        [], //screen 2 - something
    ];

    sk.setup = function() {
        sk.createCanvas(sk.windowWidth, sk.windowHeight);
        sk.addResource("phantom",sk.getFont);
        sk.addResource("frozito",sk.getFont);
        sk.addResource("unseen",sk.getFont);
        sk.guiList[1][0] = new Button(50,50,200,40, sk.color(80),"GET GOLD!"
            ,function(sk){
                if(this.inside(sk.mouseX,sk.mouseY)) {
                    this.state = sk.max(this.state, 1);
                    console.log("Hovered")
                    return;
                }
                this.state = 0;
            }
            ,function(sk){
                this.state = 2;
                console.log("Clicked");
                sk.httpPost2("/userDidSomething", sk.playerName+" "+sk.token+" "+"ADD_GOLD||50",
                    function(message){
                        console.log(message);
                        sk.gold = sk.int(message);
                    });
            }
        );
    };

    sk.gold=0;
    sk.energy = 0;

    sk.tick = 0;

    sk.draw = function() {
        var w = sk.windowWidth;
        var h = sk.windowHeight;
        sk.tick++;
        sk.updateGameStateTrans();

        if(sk.gamestate===0){ // LOADING SCREEN
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
            sk.loadBarAni+=(sk.checkLoading()-sk.loadBarAni)*0.2;
            sk.arc(w/2,h/2-15,200,200,0,sk.PI*2.0*sk.loadBarAni);
            if(sk.loaded()){
                sk.noStroke();
                sk.loadTextFade+=(1.0-sk.loadTextFade)*0.1;
                sk.fill(255*sk.loadTextFade);
                sk.textAlign(sk.CENTER);
                sk.applyFont("unseen");
                sk.textSize(18);
                sk.text("Welcome "+sk.playerName,w/2,h/2+110);
                if(sk.loadTextFade>0.99999){
                    sk.changeGameState(1);
                }
            }
        }else if(sk.gamestate===1){
            sk.fill(255);
            sk.rect(0, 0, w, h);
            sk.fill(0);
            sk.textAlign(sk.LEFT);
            sk.text(sk.gold,50,200);

        }
        if(sk.gamestateAni!=1) {
            sk.fill(0, 255 - 255 * sk.abs(sk.gamestateAni));
            sk.noStroke();
            sk.rect(0, 0, w, h);
        }
        //gui handling

        let guis = sk.guiList[sk.gamestate];
        for (let i =0;i<guis.length;i++){
            guis[i].onhover(sk);
            guis[i].update(sk);
            guis[i].draw(sk);
        }

    };
    //mousePressed
    sk.mousePressed = function(){
        let guis = sk.guiList[sk.gamestate];
        for (let i =0;i<guis.length;i++){
            if(guis[i].inside(sk.mouseX,sk.mouseY)){
                guis[i].onclick(sk);
            }
        }

    };


    /// ANIMATIONS
    sk.loadTextFade = 0;
    sk.loadBarAni = 0;
    sk.gamestateAni = 1;


    /// MAJOR VARIABLES --------------------------------------
    sk.gamestate = 0;
    sk.requestGamestate = 0;

    sk.changeGameState = function(state){
        if(sk.requestGamestate==state){
            return;
        }
        sk.requestGamestate = state;
        sk.gamestateAni=-1;

    };
    sk.updateGameStateTrans = function(){
        if(sk.gamestateAni>0){
            sk.gamestate=sk.requestGamestate;
        }
        sk.gamestateAni = sk.constrain(sk.gamestateAni+0.07,-1,1);
    };



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
    };
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
    };
  
    sk.httpPost= async function (theUrl,value){
        let xhr = new XMLHttpRequest();
        xhr.open("POST", theUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(value));

        return xhr.responseText;
    };
    sk.httpGet = async function (theUrl)
    {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, true ); // false for synchronous request
        xmlHttp.send( null );
        return xmlHttp.responseText;
    };
    sk.getFromServer = function (getFromServer,keyForMap){
            sk.httpGet("/"+getFromServer).then( (message) => {
                    sk.httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            });
    };
    //use this lmao
    sk.httpPost2= function (theUrl,value,func){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200)
                func(xhr.responseText);
        };
        xhr.open("POST", theUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(value));

    };


    sk.sendToServer = function (sendToServer,value,keyForMap){
            sk.httpPost("/"+sendToServer,value).then( (message) => {
                    sk.httpGetMap.set(keyForMap,message);
            }).catch( (message) => {
            console.log(message);
            })
    };
    sk.sendToServerFunc = function (sendToServer,value,func){
        sk.httpPost("/"+sendToServer,value).then( (message) => {
            console.log(message);
            func(message);
        }).catch( (message) => {
            console.log(message);
        })
    };
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