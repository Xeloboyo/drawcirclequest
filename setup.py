import random

from flask import Flask, abort, request
from flask_cors import CORS
import json


class User:
    # Variables:
    # - name
    # - accessToken

    def __init__(self, name):
        self.name = name
        print("Logging in as "+name)
        self.accessToken = ""
        for i in range(0,20):
            self.accessToken +=chr(random.randint(ord('a'), ord('z')))
        print(self.name,self.accessToken)

app = Flask(__name__)
CORS(app)


@app.route('/')
def hello_world():
    return 'Hooray!'


@app.route('/userDidSomething', methods=['POST'])
def userAction():
    print(request.json, request.data)
    # split the data by spaces
    # user action is vadlidated by a token.
    # i.e the server will recieve something like "Daniel Dhd78w3h8h78whfe9ww378rhwu attk_boss"
    # where the access token is generated on login
    splitData = request.data.split()
    print(splitData)

    return json.dumps(request.json)


# or wherever your SSL keys are
if __name__ == "__main__":
    app.run(ssl_context=('D:\\Program Files\\OpenSSL-Win64\\bin\\cert.pem',
                         'D:\\Program Files\\OpenSSL-Win64\\bin\\key.pem'),
            host="0.0.0.0")
