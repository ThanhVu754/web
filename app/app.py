import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from controllers.client_routes import client_bp

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['JSON_AS_ASCII'] = False

app.register_blueprint(client_bp)

if __name__ == '__main__':
    app.run(debug=True)
