import asyncio
import random
import os
import sys
import time

import redis
import hashlib

from flask import Flask, abort, request, send_file, render_template
from flask_cors import CORS
import json

def xor_crypt_string(data, key='awesomepassword', encode=False, decode=False):
    from itertools import  cycle
    import base64
    if decode:
        data = base64.b64decode(data)
    xored = ''.join(chr(a ^ ord(b)) for (a, b) in zip(data, cycle(key)))
    if encode:
        return base64.b64encode(xored.encode()).strip()
    return xored

# gotta protecc that api key

try: # serverside
    decrt = os.environ['REDIS_URL']
except: #local testing
    rediskey = b"GgAIBRwPFx5aD0AAVgUHUAoAAwMBW1EDCQRWCARXBVdaVwAPUgxTAANbBAMBAlMEDFBcAVBWAgQGAAIKAVFaUgMBVgxcCVwFAVYMeFFQCx0EBx8BCgcVAwcfARZSWVhHQkxTGgQbUVtVQ19XVUJGHlFeWgIGAQoICQ=="
    decryptkey = sys.argv[1]
    random.seed(decryptkey)
    while len(decryptkey) < 121:
        decryptkey += str(random.randint(0, 9))
    decrt = xor_crypt_string(rediskey, decryptkey, False, True)

r = redis.from_url(decrt)





# r = redis.from_url(os.environ.get("REDIS_URL"))

def map_to_js_compatible_str(map):
    if len(map)==0:
        return "[[]]"
    x = "[["
    for index, key in enumerate(map):
        x += ("" if index == 0 else ",") + "\""+str(key)+ "\"" + ","+ "\"" + str(map[key])+ "\"" + "]"
    x += "]"
    return x


class User:
    # Variables:
    # - name STRING
    # - accessToken STRING
    # - basicstat{} DICTIONARY with STRING keys
    # PLACEHOLDERS & TESTING:
    # - gold
    def __init__(self, name):
        self.name = name
        print("Logging in as " + name)
        self.accessToken = ""
        for i in range(0, 20):
            self.accessToken += chr(random.randint(ord('a'), ord('z')))
        print(self.name, self.accessToken)

        self.basicstat = getBasicStat(name)

    def __str__(self):
        return "User:" + self.name + "|" + self.accessToken

    def setBasicStat(self, key, stat):
        self.basicstat[key] = str(stat)
        updateBasicStat(self.name, self.basicstat)


userlist = []

def userValid(userName, token):

    confirm = False
    selUser = None
    for user in userlist:
        if user.name == userName and user.accessToken == token:
            confirm = True
            selUser = user

    return confirm, selUser

def getUserNames():
    str = ""
    for user in userlist:
        str += user.name + ","
    return str


logins = {}


class LoginAttempt:
    def __init__(self, ip, lastTime, loginAttempts):
        self.ip = ip
        self.lastTime = lastTime
        self.loginAttempts = loginAttempts

    def canLogin(self, currenttime):
        return currenttime > self.lastTime + max(self.loginAttempts - 5, 0) * 60


def getFromDB(key):
    return r.get(key).decode("utf-8")


def existInDB(key):
    return r.exists(key)


def sendToDB(key, value):
    r.set(key, value)


def removeFromDB(key):
    r.delete(key)


def updateBasicStat(playerName, new_stats):
    stats = getBasicStat(playerName)
    for key in new_stats:
        stats[key] = new_stats[key]

    string_dic = ""
    index = 0
    for key in stats:
        string_dic += ("" if index == 0 else "&~") + str(key)+"&~"+str(stats[key])
        index += 1
    sendToDB(playerName + "_STATS_BASIC", string_dic)


def getBasicStat(playerName):
    return getStatMap(playerName, "BASIC")


def getStatMap(playerName, mapname):
    if not existInDB(playerName + "_STATS_" + mapname):
        sendToDB(playerName + "_STATS_" + mapname, "")
    string_dic = getFromDB(playerName + "_STATS_" + mapname).split('&~')
    output = {}
    print(mapname + " STAT", len(string_dic), string_dic)
    if len(string_dic) == 1:
        return output

    for i in range(len(string_dic)):
        if i % 2 == 0:
            output[string_dic[i]] = string_dic[i + 1]
    return output


# to send images go: return send_file(filename, mimetype='image/Insert_image_format_here')
def do_action(user, action):
    print("Action:" + action)
    # ADD SHIT HERE
    actionType = action.split("||")
    # DO NOT USE FUNCTIONS LIKE THIS IN THE REAL GAME, THESE ARE EXPLOITABLE!!!!!!
    if actionType[0] == "ADD_GOLD":
        user.setBasicStat("gold", int(user.basicstat.get("gold", 0)) + int(actionType[1]))
        return str(user.basicstat["gold"])
    if actionType[0] == "SET_PLAYER_CLASS":
        current_class = user.basicstat.get("class", "none")
        if current_class == "none":
            user.setBasicStat("class", actionType[1])
        return str(user.basicstat.get("class", "none"))

    return "Player does " + action


app = Flask(__name__)
CORS(app)


@app.route('/imageTest')
def getTestImage():
    return send_file("static/img/birb.png", mimetype='image/png')


@app.route('/img/<imgname>')
def get_img(imgname):
    print("REQUSTING:",imgname)
    format = imgname.split(".", 1)[1]
    try:
        return send_file("static/img/" + imgname, mimetype='image/' + format)
    except FileNotFoundError:
        return send_file("static/img/404.png", mimetype='image/png')


@app.route('/font/<fontname>')
def get_font(fontname):
    return send_file("static/font/" + fontname + ".otf", mimetype='font/otf')


@app.route('/registerUSR', methods=['POST'])
def register():
    username = request.form['username']
    if len(username) < 6:
        return render_template('register.html', errormsg="username above 5 characters plz")
    password = request.form['password']
    if len(password) < 7:
        return render_template('register.html', errormsg="password above 6 characters plz")
    password2 = request.form['passwordrepeat']
    token = request.form['token']
    if password != password2:
        return render_template('register.html', errormsg="passwords dont match")

    if not existInDB("DCt0k3n" + token):
        return render_template('register.html', errormsg="invalid token :O")

    passhash = hashlib.md5(bytes(request.form['password'], 'utf-8')).hexdigest()
    sendToDB(username, passhash)
    removeFromDB("DCt0k3n" + token)
    return render_template('redirect.html', name="www.dcquest.ga")
    # redirect bc you cant as easily edit js in the dns's thing.


@app.route('/register')
def register_page():
    return render_template('register.html', errormsg=" ")



@app.route('/game_const/<name>')
def get_game_constants(name):
    return str(getFromDB("$$GAMEVAR_"+name))

# to remove in production
@app.route('/devuserlist')
def getusrs():
    return "".join(map(str, userlist))


@app.route('/devtotaluserlist')
def getallusrs():
    return "".join(map(str, r.keys("*")))


@app.route('/')
def login_page():
    return render_template('login.html', errormsg=" ")


# logout a user
@app.route('/user_quit', methods=['POST'])
def logout():
    print(request.json, request.data)
    for user in userlist:
        if user.name == request.json['playername'] and user.accessToken == request.json['playertoken']:
            userlist.remove(user)
            sendToDB("USERS", getUserNames())
            break

    return render_template('login.html', errormsg="You are now logged out c:")


# Login a user, (username only, implement password later)
@app.route('/login', methods=['POST'])
def user_login():
    ip = request.remote_addr
    if str(ip) in logins:
        if not logins[str(ip)].canLogin(time.time()):
            return render_template('login.html',
                                   errormsg="you have logged in too many times, please wait a few minutes")

    # user is already logged in
    usrname = request.form['username']
    if usrname != "devtest":  # bypass user
        if not existInDB(usrname):
            if not str(ip) in logins:
                logins[str(ip)] = LoginAttempt(ip, time.time(), 0)
            logins[str(ip)].loginAttempts += 1
            return render_template('login.html', errormsg="user doesnt exist")

        if not getFromDB(usrname) == hashlib.md5(bytes(request.form['password'], 'utf-8')).hexdigest():
            if not str(ip) in logins:
                logins[str(ip)] = LoginAttempt(ip, time.time(), 0)
            logins[str(ip)].loginAttempts += 1
            return render_template('login.html', errormsg="incorrect password")
        # add user to active users
    newuser = User(usrname)
    userlist.append(newuser)
    sendToDB("USERS", getUserNames())
    print("USER:", newuser.name, newuser.accessToken)
    logins[str(ip)] = LoginAttempt(ip, time.time(), 0)
    return render_template('game.html', name=usrname, token=newuser.accessToken)


@app.route('/userStats/<type>', methods=['POST'])
def userStats(type):
    splitData = str(request.json).split(" ", 2)
    confirm, selUser = userValid(splitData[0], splitData[1])
    if confirm:
        somemap = getStatMap(selUser.name,type)
        return map_to_js_compatible_str(somemap)
    return "error 400|access denied"

@app.route('/userDidSomething', methods=['POST'])
def user_action():
    print(request.json, request.data)
    # split the data by spaces
    # user action is vadlidated by a token.
    # i.e the server will recieve something like "Daniel Dhd78w3h8h78whfe9ww378rhwu attk_boss"
    # where the access token is generated on login
    splitData = str(request.json).split(" ", 2)
    print(splitData)

    confirm,selUser = userValid(splitData[0],splitData[1])

    if confirm:
        response = do_action(selUser, splitData[2])
        print("ACTION REPONSE:", response)
        return response

    return "error 400|access denied"


# or wherever your SSL keys are
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port)

# ssl_context=('cert.pem',
#                         'key.pem'),
