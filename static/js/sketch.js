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

function inside(mx,my,x,y,w,h) {
    return mx>x&&mx<x+w&&y<my&&my<y+h;
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




p5.disableFriendlyErrors = true;

var sketch = function( sk ) {


    sk.player_class_list = [];
    sk.guiList = [
        [], //screen 0 - loading
        [], //screen 1 - game menu?
        [], //screen 2 - cutscene
        [], //screen 3 - class select (selection panels not part of this)
    ];

    sk.setup = function() {
        sk.createCanvas(sk.windowWidth, sk.windowHeight,sk.WEBGL);
        sk.addResource("phantom",sk.getFont);
        sk.addResource("frozito",sk.getFont);
        sk.addResource("unseen",sk.getFont);
        sk.addResource("BASIC",sk.getStats);
        sk.addResource("class_0.png",sk.getImage);
        sk.guiList[1][0] = new Button(50,50,200,40, sk.color(80),"GET GOLD!"
            ,function(sk){
                if(this.inside(sk.mouseX,sk.mouseY)) {
                    this.state = 1;
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
        sk.translate(-w/2,-h/2); //-----------------  enable when WEBGL is fixed
        sk.tick++;
        sk.updateGameStateTrans();

        if(sk.gamestate===0){ // LOADING SCREEN
            sk.background(0);
            sk.push();
            sk.fill(255);
            sk.textAlign(sk.CENTER);
            sk.applyFont("phantom");
            sk.textSize(64);
            //sk.text("Awe",-999,-999);
            sk.text("DC",w/2,h/2);
            sk.applyFont("frozito");
            sk.textSize(24);
            //sk.text("Awe",-999,-999);
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
                //sk.text("Awe",-999,-999);
                sk.text("Welcome "+sk.playerName,w/2,h/2+110);
                if(sk.loadTextFade>0.99999){
                    let destState = 1;
                    if(sk.isUndef(sk.httpGetMap.get("BASIC").get("class"))){
                        destState = 2;
                    }
                    sk.changeGameState(destState);
                }
            }
            //CHECK FOR STATS


        }else if(sk.gamestate===1){
            sk.fill(255);
            sk.rect(0, 0, w, h);
            sk.fill(0);
            sk.textAlign(sk.LEFT);
            sk.text(sk.gold,50,200);

        }else if(sk.gamestate===2){
            sk.text("Awe",-999,-999);

            sk.background(30,50+20*sk.sin(0.01*sk.tick),50+20*sk.cos(0.01*sk.tick));
            let timeleft = 300-(sk.tick-sk.lastStateChangeTick);
            sk.textAlign(sk.LEFT);
            sk.fill(255);
            sk.text("CUTSCENE NOT FOUND, ENDING IN "+timeleft,50,50,500,300);
            if(timeleft<=0){
                sk.changeGameState(3);
            }
        }else if(sk.gamestate===3){

            let aspect = 1000/1280;

            if(sk.player_class_list.length==0&&!sk.sentClassSelect){
                sk.httpGet2("/game_const/CLASSES",function(message){console.log(message);sk.player_class_list=message.split("|")});
                sk.sentClassSelect = true;
            }

            sk.push();

            sk.translate(sk.random(-sk.shakeani,sk.shakeani),0);

            let nspace = w - h*aspect;
            let totalClass =sk.player_class_list.length;
            if(nspace<80*sk.player_class_list.length){ // cant fit everything horizontally at once , prolly phone screen

            }else if(nspace<200*sk.player_class_list.length){

                //sk.fill(100,100,130);
                sk.tint(100,100,130);
                for (let i = 0; i < sk.player_class_list.length; i++) {
                    let ai = sk.player_class_list.length-((sk.selected_class+i)%sk.player_class_list.length)-1;
                    let xoff2 = ai>sk.selected_class? h*aspect-nspace/(totalClass-1):0;
                    sk.drawImage("class_" + sk.player_class_list[ai] + ".png", ai * nspace/(totalClass-1) , 0, h * aspect, h);
                    if(inside(sk.mouseX,sk.mouseY,xoff2+ ai * nspace/(totalClass-1) , 0,nspace/(totalClass-1), h)){
                        sk.changeClassPanel(ai);
                    }
                }
                sk.fill(0,0,30,100);
                sk.rect(0,0,w,h);
                sk.tint(255);
                let ox = sk.selected_class * nspace/(sk.player_class_list.length-1);
                sk.drawImage("class_" + sk.player_class_list[sk.selected_class] + ".png", ox , 0, h * aspect, h);
                let infoareaWidth = h * aspect*0.5;
                sk.fill(0,0,0,150);
                sk.rect(ox+h * aspect-infoareaWidth-10,10,infoareaWidth,h*0.5);
                sk.fill(255);
                sk.text("AweSOME",-999,-999);
                sk.text("STATS",ox+h * aspect-infoareaWidth-10+20,10+20,infoareaWidth-40,h*0.5-40);
            }else{
                let awidth = (w - h*aspect)-100*sk.player_class_list.length; //panel extra width
                nspace=(w - (h*aspect + awidth)); //total 'unused' space between panels

                for (let i = 0; i < totalClass; i++) {
                    let ai = totalClass-((sk.selected_class+i)%totalClass)-1;
                    let xoff = ai>sk.selected_class? awidth:0;
                    let xoff2 = ai>sk.selected_class? h*aspect+awidth-nspace/(totalClass-1):0;
                    sk.drawImage("class_" + sk.player_class_list[ai] + ".png", xoff+ ai * nspace/(totalClass-1) , 0, h * aspect, h);
                    if(inside(sk.mouseX,sk.mouseY,xoff2+ ai * nspace/(totalClass-1) , 0,nspace/(totalClass-1), h)){
                        sk.changeClassPanel(ai);
                    }
                }
                sk.fill(0,0,30,100);
                sk.rect(0,0,w,h);
                sk.tint(255);
                let ox = sk.selected_class * nspace/(sk.player_class_list.length-1);
                sk.drawImage("class_" + sk.player_class_list[sk.selected_class] + ".png", ox , 0, h * aspect, h);
                let infoareaWidth = h * aspect*0.5;
                sk.fill(0,0,0);
                sk.rect(ox+h * aspect,0,awidth,h);
                sk.fill(255);
                sk.text("AweSOME",-999,-999);
                sk.text("STATS",ox+h * aspect+20,20,awidth-40,h-40);
            }


            sk.pop();
            if(sk.tick%50==0){

            }
            sk.shakeani/=1.5;

            //sk.drawImage("class_0.png",h*aspect,0,h*aspect,h);
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

    sk.keyPressed=function(){
        switch (sk.gamestate) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                sk.changeGameState(3);
                break;
            case 3:
                if(sk.keyCode===sk.ENTER) {
                    sk.httpPost2("/userDidSomething", sk.playerName+" "+sk.token+" "+"SET_PLAYER_CLASS||"+sk.player_class_list[sk.selected_class],
                    function(message){
                        console.log(message);
                        sk.gold = sk.int(message);
                    });
                    sk.changeGameState(1);
                }
                break;

        }
    }


    /// ANIMATIONS
    sk.loadTextFade = 0;
    sk.loadBarAni = 0;
    sk.gamestateAni = 1;

    sk.lastStateChangeTick = 0;

    //state 3
    sk.shakeani = 0;
    sk.changeClassPanel = function(panel){
        if(sk.selected_class==panel){
            return;
        }
        sk.shakeani = 15;
        sk.selected_class = panel;
    }


    /// MAJOR VARIABLES --------------------------------------

    //0 - loading
    //1 - game home
    //2 - beginning cutscene
    //3 - class select
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
        let pgm = sk.gamestate;
        if(sk.gamestateAni>0){
            sk.gamestate=sk.requestGamestate;
            if(sk.gamestate!=pgm) {
                sk.lastStateChangeTick = sk.tick;
            }
        }
        sk.gamestateAni = sk.constrain(sk.gamestateAni+0.07,-1,1);
    };

    // screens
    //3 character select
    sk.selected_class = 0;


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
            let res = sk.httpGetMap.get(sk.resourceReq[i]);
            if(!sk.isUndef(res)
                &&(!(res instanceof p5.Font)||!sk.isUndef(res.font)))
            {
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
    sk.httpGet2= function (theUrl,func){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200)
                func(xhr.responseText);
        };
        xhr.open("GET", theUrl, true);
        xhr.send(null);

    };
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
    // adds result to a key in map
    sk.httpPost2= function (theUrl,value,func,key){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200)
                sk.httpGetMap.set(key,func(xhr.responseText));
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
    sk.drawImage2 = function(key,x,y,w,h){
        if(sk.httpGetMap.has(key)){

            sk.beginShape();
            sk.texture(sk.httpGetMap.get(key));
            sk.vertex(x,y,0,0);
            sk.vertex(x+w,y,1,0);
            sk.vertex(x+w,y+h,1,1);
            sk.vertex(x,y+h,0,1);

            sk.endShape();
           // sk.image(sk.httpGetMap.get(key), x,y,w,h);
        }else{
            sk.fill(255,0,255);
            sk.rect(x,y,w,h);
        }
    }

    sk.getImage = async function (imageName){
        //"https://via.placeholder.com/600?text=FILE+NOT+FOUND"
        let img = sk.loadImage('/img/'+imageName)

        sk.httpGetMap.set(imageName,img);
    }


    sk.getFont = async function (fontName){
        sk.httpGetMap.set(fontName,sk.loadFont('/font/'+fontName));
    }
    
    sk.applyFont = function(key){
        if(sk.httpGetMap.has(key)){
            sk.textFont(sk.httpGetMap.get(key));
        }else{
            sk.textFont("Helvetica");
        }

    }

    sk.formatStats = function (str){
        console.log("parsing:",str);
        return new Map(JSON.parse(str));
    }
    sk.getStats = async function (type){
        sk.httpPost2("/userStats/"+type,sk.playerName+" "+sk.token,sk.formatStats,type);
    }
};