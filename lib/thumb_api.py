#
# Gallery WebApp
# Copyright 2019-2021 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import json
import os
import threading
from . import browse_api
from . import cachegen
from . import config
from . import image
from . import utils
from . import log
from flask import Blueprint, abort, request, send_file

api = Blueprint(__name__, __name__)

thumbgenThreadRunning=False
def thumbgenThread():
    global thumbgenThreadRunning
    thumbgenThreadRunning=True
    cachegen.createCachedImages('')
    thumbgenThreadRunning=False

@api.route('/', methods = ['GET', 'POST'])
def root():
    global thumbgenThreadRunning
    cmd = request.args.get('cmd')
    log.info("Thumb command: %s" % cmd)
    if cmd == 'status' and request.method == 'GET':
        return json.dumps({'thumbgenThreadRunning':thumbgenThreadRunning}, separators=(',',':')), 200, {'Content-Type': 'application/json; charset=utf-8'}
    elif cmd == 'gen' and request.method == 'POST':
        if not thumbgenThreadRunning:
            thread = threading.Thread(target=thumbgenThread)
            thread.start()
        return json.dumps({'ok':True}, separators=(',',':')), 200, {'Content-Type': 'application/json; charset=utf-8'}
    else:
        log.error("Invalid command")
        abort(403)
        return

@api.route('/<path:path>', methods = ['GET', 'POST'])
def folder(path):
    log.info("Thumb %s" % path)

    if ('/../' in path):
        log.error("Invalid path %s" % path)
        abort(403)
        return

    if request.method == 'POST':
        cmd = request.args.get('cmd')
        log.info("Thumb command: %s" % cmd)
        if cmd == 'set':
            data = request.get_json(silent=True)
            log.info("Thumb POST %s" % str(data))
            if 'thumb' not in data:
                log.error("Invalid data")
                abort(403)
                return
            browse_api.saveInfo(path+"/", data['thumb'])
            return json.dumps({'ok':True}, separators=(',',':')), 200, {'Content-Type': 'application/json; charset=utf-8'}
        else:
            log.error("Invalid command")
            abort(403)
            return

    fType=utils.fileType(path)
    if not ('image'==fType or'video'==fType):
        log.error("Invalid file type on path %s" % path)
        abort(403)
        return

    fullPath=config.cacheFolder+path
    if not utils.createDir(os.path.dirname(fullPath)):
        log.error("Failed to create folder for %s" % path)
        abort(403)
        return
    thumbName=utils.removeExtension(fullPath)+config.thumbSuffix
    if not image.createImage(config.sourceFolder+path, thumbName, fType, config.thumbSize, config.thumbQuality):
        log.error("Failed to create thumbnail for %s" % path)
        abort(404)
        return
    if thumbName.startswith('/'):
        fullPath=thumbName
    else:
        fullPath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../"+thumbName)
    log.info("Send file "+fullPath)
    return send_file(fullPath, mimetype='image/jpeg')


