import asyncio
import random
import os
import time
import bot
import redis
import hashlib
import threading

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
    # - name
    # - accessToken

    def __init__(self, name):
        self.name = name
        print("Logging in as " + name)
        self.accessToken = ""
        for i in range(0, 20):
            self.accessToken += chr(random.randint(ord('a'), ord('z')))
        print(self.name, self.accessToken)

    def __str__(self):
        return "User:"+self.name+"|"+self.accessToken


userlist = []


def getFromDB(key):
    return r.get(key).decode("utf-8")


def existInDB(key):
    return r.exists(key)


def sendToDB(key, value):
    r.set(key, value)


def removeFromDB(key):
    r.delete(key)


# to send images go: return send_file(filename, mimetype='image/Insert_image_format_here')
def do_action(action):
    print(action)
    # ADD SHIT HERE
    return "Player does " + action


app = Flask(__name__)
CORS(app)


@app.route('/imageTest')
def getTestImage():
    return send_file("static/img/town_placehold.png", mimetype='image/png')


@app.route('/font/<fontname>')
def get_font(fontname):
    # time.sleep(random.randint(0, 10) / 10.0)  ## TEST LATENCY, REMOVE LATER
    return send_file("static/font/" + fontname + ".otf", mimetype='font/otf')


@app.route('/registerUSR', methods=['POST'])
def register():
    username = request.form['username']
    if len(username) < 3:
        return render_template('register.html', errormsg="username above 2 characters plz")
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
    removeFromDB("DCt0k3n"+token)  # not yet! :)
    return render_template('login.html', errormsg=" ")


@app.route('/register')
def register_page():
    return render_template('register.html', errormsg=" ")

# to remove in production
@app.route('/devuserlist')
def getusrs():
    return "".join(map(str,userlist))

@app.route('/devtotaluserlist')
def getallusrs():
    return "".join(map(str, r.keys("*")))


@app.route('/')
def login_page():
    return render_template('login.html', errormsg=" ")


# Login a user, (username only, implement password later)
@app.route('/login', methods=['POST'])
def user_login():
    # user is already logged in
    usrname = request.form['username']
    if usrname != "devtest":  # bypass user
        if not existInDB(usrname):
            return render_template('login.html', errormsg="user doesnt exist")

        if not getFromDB(usrname) == hashlib.md5(bytes(request.form['password'], 'utf-8')).hexdigest():
            return render_template('login.html', errormsg="incorrect password")
        # add user to active users
    newuser = User(usrname)
    userlist.append(newuser)
    print("USER:", newuser.name, newuser.accessToken)
    return render_template('game.html', name=usrname, token=newuser.accessToken)


@app.route('/userDidSomething', methods=['POST'])
def user_action():
    print(request.json, request.data)
    # split the data by spaces
    # user action is vadlidated by a token.
    # i.e the server will recieve something like "Daniel Dhd78w3h8h78whfe9ww378rhwu attk_boss"
    # where the access token is generated on login
    splitData = request.data.decode("utf-8").split(" ", 2)
    print(splitData)

    confirm = False
    for user in userlist:
        if user.name == splitData[0] and user.accessToken == splitData[1]:
            confirm = True

    if confirm:
        return do_action(splitData[2])

    return "error 400"


# or wherever your SSL keys are
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    threading.Thread(target=bot.run).start()
    app.run(
        host="0.0.0.0",
        port=port)

# ssl_context=('cert.pem',
#                         'key.pem'),
