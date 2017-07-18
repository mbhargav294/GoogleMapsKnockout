from flask import Flask, render_template, request, jsonify
from flask import redirect, jsonify, url_for, flash, abort

app = Flask(__name__)


@app.route('/')
def showMainPage():
    return render_template("main.html")


if __name__ == '__main__':
    app.secret_key = 'my_secret_key'
    app.debug = True
    app.run(host='127.0.0.1', port=8080)
