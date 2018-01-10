import flask
import logging

from flask_cors import CORS

log = logging.getLogger(__name__)
app = flask.Flask(__name__)

CORS(app)

@app.route('/ping', methods=['GET'])
def ping():
    return "pong"


def debug():
    app.run('0.0.0.0', debug=True, threaded=True, port=9999)
