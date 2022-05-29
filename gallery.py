#
# Gallery WebApp
# Copyright 2019-2022 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from twisted.internet import reactor
from twisted.web import static, resource

import lib.flask_app as flask_app
import lib.config as config
import lib.log as log
import lib.cachegen as cachegen

def startServer():
    root = static.File(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui'))
    root.putChild(b'source', static.File(config.sourceFolder))
    root.putChild(b'api', WSGIResource(reactor, reactor.getThreadPool(), flask_app.app))
    site=Site(root)
    reactor.listenTCP(config.port, site)
    log.info("Starting server on port %d " % config.port)
    reactor.run()

if __name__=='__main__':
    mode = config.load()
    if 'server' == mode:
        startServer()
    elif 'cache' == mode:
        log.enabled = True
        log.info("Creating cached images")
        cachegen.createCachedImages('')
