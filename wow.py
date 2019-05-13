import asyncio
import random
import os
import time

import redis
import hashlib

from flask import Flask, abort, request, send_file, render_template
from flask_cors import CORS
import json

r = redis.from_url(
    "redis://h:p5d77d98513cd400d85c1ecf76a4e92b6435e49fe7fa3258082dbe20d9d0d43b5@ec2-34-193-52-1.compute-1.amazonaws.com:22319")


# r = redis.from_url(os.environ.get("REDIS_URL"))

# from distutils.core import setup

# setup(
#    name='DrawingCircleQuest',
#    version='0.1dev',
#    license='Creative Commons Attribution-Noncommercial-Share Alike license',
#    long_description="insert long description",
# )


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
        updateBasicStat(self.name,self.basicstat)


userlist = []


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
        string_dic += ("" if index == 0 else "&~") + str(key) + "&~" + str(stats[key])
        index += 1
    sendToDB(playerName + "_STATS_BASIC", string_dic)


def getBasicStat(playerName):
    if not existInDB(playerName + "_STATS_BASIC"):
        sendToDB(playerName + "_STATS_BASIC", "")
    string_dic = getFromDB(playerName + "_STATS_BASIC").split('&~')
    output = {}
    print("BASIC STAT", len(string_dic), string_dic)
    if len(string_dic) == 1:
        return output

    for i in range(len(string_dic)):
        if i % 2 == 0:
            output[string_dic[i]] = string_dic[i + 1]
    return output


# to send images go: return send_file(filename, mimetype='image/Insert_image_format_here')
def do_action(user, action):
    print("Action:"+action)
    # ADD SHIT HERE
    actionType = action.split("||")
    # DO NOT USE FUNCTIONS LIKE THIS IN THE REAL GAME, THESE ARE EXPLOITABLE
    if (actionType[0] == "ADD_GOLD"):
        user.setBasicStat("gold", int(user.basicstat.get("gold", 0)) + int(actionType[1]))
        return str(user.basicstat["gold"])
    return "Player does " + action


app = Flask(__name__)
CORS(app)


@app.route('/imageTest')
def getTestImage():
    return send_file("static/img/birb.png", mimetype='image/png')


@app.route('/font/<fontname>')
def get_font(fontname):
    # time.sleep(random.randint(0, 10) / 10.0)  ## TEST LATENCY, REMOVE LATER
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
    removeFromDB("DCt0k3n" + token)  # not yet! :)
    return render_template('login.html', errormsg=" ")


@app.route('/register')
def register_page():
    return render_template('register.html', errormsg=" ")


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
    sendToDB("USERS",getUserNames())
    print("USER:", newuser.name, newuser.accessToken)
    logins[str(ip)] = LoginAttempt(ip, time.time(), 0)
    return render_template('game.html', name=usrname, token=newuser.accessToken)


@app.route('/userDidSomething', methods=['POST'])
def user_action():
    print(request.json, request.data)
    # split the data by spaces
    # user action is vadlidated by a token.
    # i.e the server will recieve something like "Daniel Dhd78w3h8h78whfe9ww378rhwu attk_boss"
    # where the access token is generated on login
    splitData = str(request.json).split(" ", 2)
    print(splitData)

    confirm = False

    for user in userlist:
        if user.name == splitData[0] and user.accessToken == splitData[1]:
            confirm = True
            selUser = user
    if confirm:
        response =  do_action(selUser, splitData[2])
        print("ACTION REPONSE:", response)
        return response;

    return "error 400"


# or wherever your SSL keys are
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port)

# ssl_context=('cert.pem',
#                         'key.pem'),
