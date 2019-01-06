#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import json
import os
from . import config
from . import image
from . import utils
from . import log
from flask import Blueprint, abort, send_file

api = Blueprint(__name__, __name__)

@api.route('/<path:path>')
def root(path):
    log.info("Thumb "+path)
    if ('/../' in path):
        log.error("Invalid path "+path)
        abort(403)
        return
    fType=utils.fileType(path)
    if not ('image'==fType or'video'==fType):
        log.error("Invalid file type on path "+path)
        abort(403)
        return

    fullPath=config.cacheFolder+path
    if not utils.createDir(os.path.dirname(fullPath)):
        log.error("Failed to create folder for "+path)
        abort(403)
        return
    thumbName=utils.removeExtension(fullPath)+config.thumbSuffix
    if not image.createImage(config.sourceFolder+path, thumbName, fType, config.thumbSize, config.thumbQuality):
        log.error("Failed to create thumbnail for "+path)
        abort(404)
        return
    if thumbName.startswith('/'):
        fullPath=thumbName
    else:
        fullPath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../"+thumbName)
    log.info("Send file "+fullPath)
    return send_file(fullPath, mimetype='image/jpeg')


