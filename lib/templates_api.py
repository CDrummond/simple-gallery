#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
from . import config
from . import utils
from . import log
from flask import Blueprint, abort, render_template

api = Blueprint(__name__, __name__)

@api.route('/<path:path>')
def root(path):
    log.info("Template "+path)
    if ('/../' in path):
        log.error("Invalid path "+path)
        abort(403)
        return

    # render_template does not seem to set mimetype for css???
    if path.endswith('.css'):
        path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../templates/"+path)
        if not os.path.exists(path):
            abort(404)
            return

        with open(path, 'r') as temp:
            data=temp.read()
            data=data.replace("{{THUMB_SIZE}}", str(config.htmlThumbSize))
            data+=".navbar { display: none; }"
            return data, 200, {'Content-Type': 'text/css; charset=utf-8'}

        abort(404)
        return
    return render_template(path, SERVER_ROOT=config.serverRoot, DEF_BROWSE='browse')


