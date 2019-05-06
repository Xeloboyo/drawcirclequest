import random
import os
from flask import Flask, abort, request, send_file, render_template
from flask_cors import CORS
import json


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


userlist = []


# to send images go: return send_file(filename, mimetype='image/Insert_image_format_here')
def doAction(action):
    print(action)
    # ADD SHIT HERE
    return "Player does " + action


app = Flask(__name__)
CORS(app)


@app.route('/imageTest')
def getTestImage():
    return send_file("img/town_placehold.png", mimetype='image/png')


@app.route('/')
def loginPage():
    return render_template('login.html', errormsg=" ")


# Login a user, (username only, implement password later)
@app.route('/login', methods=['POST'])
def userLogin():
    # user is already logged in
    for user in userlist:
        if user.name == request.form['username']:
            return render_template('login.html', errormsg="user is active!")
    # add user to active users
    newuser = User(request.form['username'])
    userlist.append(newuser)
    print("USER:", newuser.name,    newuser.accessToken)
    return render_template('game.html', name=request.form['username'], token=newuser.accessToken)


@app.route('/userDidSomething', methods=['POST'])
def userAction():
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
        return doAction(splitData[2])

    return "error 400"


# or wherever your SSL keys are
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port)

# ssl_context=('cert.pem',
#                         'key.pem'),
